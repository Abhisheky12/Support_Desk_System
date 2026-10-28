import http from 'http';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';

let server;
let baseUrl;

const request = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
};

const runAllTests = async () => {
  console.log('\n======================================================');
  console.log(' STARTING COMPREHENSIVE BACKEND VERIFICATION TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}: ${details}`);
      failed++;
    }
  };

  try {
    await connectDB();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`Test server running on ${baseUrl}\n`);

    // 1. Health check
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.status === 'ok', 'Health Check Endpoint /api/health');

    // 2. Auth Tests
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@supportdesk.com', password: 'admin123' }
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin Login successful with JWT');
    const adminToken = adminLogin.data.token;

    const agentLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'agent1@supportdesk.com', password: 'agent123' }
    });
    assert(agentLogin.status === 200 && agentLogin.data.user.role === 'agent', 'Agent Login successful');
    const agentToken = agentLogin.data.token;

    const invalidLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@supportdesk.com', password: 'wrongpassword' }
    });
    assert(invalidLogin.status === 401, 'Invalid password rejected with 401');

    // 3. Dashboard Statistics & Business Rules
    const statsRes = await request('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(statsRes.status === 200, 'Dashboard statistics fetched');
    const stats = statsRes.data.data;
    assert(typeof stats.totalTickets === 'number' && stats.totalTickets >= 5, 'Real total ticket count is numeric');
    assert(stats.urgentTickets >= 1, 'Real urgent tickets count matches seed');
    assert(stats.overdueTickets >= 1, 'Overdue tickets count accurately accounts for >24h open tickets');
    assert(stats.resolvedTickets >= 1, 'Resolved tickets counted');

    // 4. Ticket Search, Filter, Sorting
    const ticketsList = await request('/api/tickets', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(ticketsList.status === 200 && Array.isArray(ticketsList.data.data), 'Staff ticket listing fetched');

    // Filter by status=Resolved
    const resolvedList = await request('/api/tickets?status=Resolved', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const allResolved = resolvedList.data.data.every((t) => t.status === 'Resolved');
    assert(allResolved && resolvedList.data.data.length > 0, 'Filter by status=Resolved works');

    // Filter by priority=Urgent
    const urgentList = await request('/api/tickets?priority=Urgent', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const allUrgent = urgentList.data.data.every((t) => t.priority === 'Urgent');
    assert(allUrgent && urgentList.data.data.length > 0, 'Filter by priority=Urgent works');

    // Search by text
    const searchRes = await request('/api/tickets?search=Okta', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(searchRes.data.data.length >= 1 && searchRes.data.data[0].subject.includes('Okta'), 'Search by keyword works');

    // Sort by priority_desc
    const sortedRes = await request('/api/tickets?sortBy=priority_desc', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(sortedRes.status === 200, 'Priority weighted sort executes without errors');

    // 5. Customer Workflow & Access Token Verification
    const publicSubmit = await request('/api/public/tickets', {
      method: 'POST',
      body: {
        subject: 'Cannot login with my 2FA authentication app',
        customerName: 'Bruce Banner',
        customerEmail: 'bruce@banner.lab',
        description: 'Lost my authenticator device, need manual identity reset.',
        priority: 'High'
      }
    });
    assert(publicSubmit.status === 201 && publicSubmit.data.data.reference, 'Customer public ticket submission');
    const newRef = publicSubmit.data.data.reference;
    const newToken = publicSubmit.data.data.accessToken;

    // Track ticket without token -> should fail 401
    const trackNoToken = await request(`/api/public/tickets/${newRef}`);
    assert(trackNoToken.status === 401, 'Customer tracking without token blocked with 401');

    // Track ticket with invalid token -> should fail 403
    const trackBadToken = await request(`/api/public/tickets/${newRef}?token=wrong_token_12345`);
    assert(trackBadToken.status === 403, 'Customer tracking with invalid token blocked with 403');

    // Track ticket with valid token -> 200 OK
    const trackValid = await request(`/api/public/tickets/${newRef}?token=${newToken}`);
    assert(trackValid.status === 200 && trackValid.data.data.subject.includes('2FA'), 'Customer tracking with valid token succeeds');

    // 6. Public Reply vs Internal Note Isolation
    const staffTicket = await request(`/api/tickets/${newRef}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const staffTicketId = staffTicket.data.data._id;

    // Agent adds Public Reply
    const publicReply = await request(`/api/tickets/${staffTicketId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${agentToken}` },
      body: { content: 'Please provide proof of ID to proceed.', type: 'public' }
    });
    assert(publicReply.status === 201 && publicReply.data.data.type === 'public', 'Agent adds public reply');

    // Agent adds Internal Note
    const internalNote = await request(`/api/tickets/${staffTicketId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${agentToken}` },
      body: { content: 'ID verification flagged for fraud check.', type: 'internal' }
    });
    assert(internalNote.status === 201 && internalNote.data.data.type === 'internal', 'Agent adds internal note');

    // Customer retrieves messages: MUST ONLY receive public reply!
    const custMessages = await request(`/api/public/tickets/${newRef}/messages?token=${newToken}`);
    assert(custMessages.status === 200, 'Customer fetches messages with token');
    const messages = custMessages.data.data;
    const hasPublic = messages.some((m) => m.content.includes('Please provide proof'));
    const hasInternal = messages.some((m) => m.content.includes('fraud check'));
    assert(hasPublic, 'Customer can see public reply');
    assert(!hasInternal, 'Customer CANNOT see internal note (Security isolation verified)');

    // 7. Role-Based Permissions
    // Agent attempts assignment -> 403 Forbidden
    const agentAssign = await request(`/api/tickets/${staffTicketId}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${agentToken}` },
      body: { agentId: 'unassigned' }
    });
    assert(agentAssign.status === 403, 'Agent forbidden from assigning ticket (Admin only)');

    // Admin performs assignment -> 200 OK
    const adminAssign = await request(`/api/tickets/${staffTicketId}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { agentId: agentLogin.data.user._id }
    });
    assert(adminAssign.status === 200 && adminAssign.data.data.assignedTo.name, 'Admin successfully assigns ticket');

    // 8. Overdue Business Rule verification
    // Mark ticket resolved -> resolvedAt set, isOverdue must be false
    const resolveTicket = await request(`/api/tickets/${staffTicketId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'Resolved' }
    });
    assert(resolveTicket.status === 200 && resolveTicket.data.data.status === 'Resolved', 'Ticket resolved');
    assert(resolveTicket.data.data.isOverdue === false, 'Resolved ticket has isOverdue = false');

    // 9. Activity History verification
    const activityRes = await request(`/api/tickets/${staffTicketId}/activity`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(activityRes.status === 200 && Array.isArray(activityRes.data.data), 'Ticket activity history retrieved');
    const actions = activityRes.data.data.map((a) => a.action);
    assert(actions.includes('TICKET_CREATED'), 'Activity contains TICKET_CREATED');
    assert(actions.includes('PUBLIC_REPLY_ADDED'), 'Activity contains PUBLIC_REPLY_ADDED');
    assert(actions.includes('INTERNAL_NOTE_ADDED'), 'Activity contains INTERNAL_NOTE_ADDED');
    assert(actions.includes('TICKET_ASSIGNED'), 'Activity contains TICKET_ASSIGNED');
    assert(actions.includes('TICKET_RESOLVED'), 'Activity contains TICKET_RESOLVED');

    console.log(`\n======================================================`);
    console.log(` TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await disconnectDB();
  }
};

runAllTests();

