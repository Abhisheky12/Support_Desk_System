import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import Message from '../models/Message.js';
import Activity from '../models/Activity.js';
import { generateAccessToken, hashAccessToken } from '../utils/ticketReference.js';

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/support_desk';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing records...');
    await Promise.all([
      User.deleteMany({}),
      Ticket.deleteMany({}),
      Message.deleteMany({}),
      Activity.deleteMany({})
    ]);

    console.log('Seeding demo users...');
    // Demo Admin
    const adminUser = await User.create({
      name: 'Sarah Connor (Admin)',
      email: 'admin@supportdesk.com',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });

    // Demo Agents
    const agent1 = await User.create({
      name: 'Alex Rivera (Senior Agent)',
      email: 'agent1@supportdesk.com',
      password: 'agent123',
      role: 'agent',
      isActive: true
    });

    const agent2 = await User.create({
      name: 'Morgan Chen (Support Agent)',
      email: 'agent2@supportdesk.com',
      password: 'agent123',
      role: 'agent',
      isActive: true
    });

    console.log('Demo Users Created:');
    console.log(` - Admin: admin@supportdesk.com / admin123`);
    console.log(` - Agent 1: agent1@supportdesk.com / agent123`);
    console.log(` - Agent 2: agent2@supportdesk.com / agent123`);

    console.log('Seeding demo tickets, conversations, and audit history...');

    const now = Date.now();
    const HOUR = 60 * 60 * 1000;

    // Helper for generating tokens
    const createTokenData = () => {
      const plain = generateAccessToken();
      return { plain, hash: hashAccessToken(plain) };
    };

    // 1. Overdue Urgent Ticket (Created 36 hours ago, Open)
    const token1 = createTokenData();
    const created36hAgo = new Date(now - 36 * HOUR);
    const ticket1 = await Ticket.create({
      reference: 'TCK-100801',
      subject: 'Critical Production API Latency Spike (>5000ms)',
      customerName: 'Acme Corp (DevOps Lead)',
      customerEmail: 'devops@acmecorp.com',
      description: 'Our payment processing endpoints are timing out intermittently since yesterday morning. Customers are unable to complete checkout.',
      priority: 'Urgent',
      status: 'Open',
      assignedTo: agent1._id,
      accessTokenHash: token1.hash,
      resolvedAt: null,
      createdAt: created36hAgo,
      updatedAt: created36hAgo
    });

    await Activity.create({
      ticket: ticket1._id,
      ticketReference: ticket1.reference,
      actor: { name: ticket1.customerName, email: ticket1.customerEmail, role: 'customer' },
      action: 'TICKET_CREATED',
      description: `Ticket created by ${ticket1.customerName}`,
      createdAt: created36hAgo
    });

    await Activity.create({
      ticket: ticket1._id,
      ticketReference: ticket1.reference,
      actor: { name: adminUser.name, email: adminUser.email, role: adminUser.role, id: adminUser._id },
      action: 'TICKET_ASSIGNED',
      description: `Ticket assigned to ${agent1.name}`,
      previousValue: 'Unassigned',
      newValue: agent1.name,
      createdAt: new Date(now - 35 * HOUR)
    });

    await Message.create({
      ticket: ticket1._id,
      ticketReference: ticket1.reference,
      type: 'internal',
      senderRole: 'admin',
      senderName: adminUser.name,
      senderUser: adminUser._id,
      content: 'Escalated from tier 1. Needs immediate diagnostics from infrastructure engineering.',
      createdAt: new Date(now - 34 * HOUR)
    });

    await Activity.create({
      ticket: ticket1._id,
      ticketReference: ticket1.reference,
      actor: { name: adminUser.name, email: adminUser.email, role: adminUser.role, id: adminUser._id },
      action: 'INTERNAL_NOTE_ADDED',
      description: `Internal note added by ${adminUser.name}`,
      createdAt: new Date(now - 34 * HOUR)
    });

    // 2. Old Ticket that is RESOLVED (Created 48h ago, resolved 6h ago -> MUST NOT be overdue!)
    const token2 = createTokenData();
    const created48hAgo = new Date(now - 48 * HOUR);
    const resolved6hAgo = new Date(now - 6 * HOUR);
    const ticket2 = await Ticket.create({
      reference: 'TCK-100802',
      subject: 'SSO SAML Integration assertion failure with Okta',
      customerName: 'Wayne Enterprises (IT Support)',
      customerEmail: 'security@wayne.com',
      description: 'SAML response fails signature verification after renewing certificate.',
      priority: 'High',
      status: 'Resolved',
      assignedTo: agent2._id,
      accessTokenHash: token2.hash,
      resolvedAt: resolved6hAgo,
      createdAt: created48hAgo,
      updatedAt: resolved6hAgo
    });

    await Activity.create({
      ticket: ticket2._id,
      ticketReference: ticket2.reference,
      actor: { name: ticket2.customerName, email: ticket2.customerEmail, role: 'customer' },
      action: 'TICKET_CREATED',
      description: `Ticket created by ${ticket2.customerName}`,
      createdAt: created48hAgo
    });

    await Message.create({
      ticket: ticket2._id,
      ticketReference: ticket2.reference,
      type: 'public',
      senderRole: 'agent',
      senderName: agent2.name,
      senderUser: agent2._id,
      content: 'We updated the public certificate fingerprint in your SAML connector. Please test login now.',
      createdAt: new Date(now - 8 * HOUR)
    });

    await Activity.create({
      ticket: ticket2._id,
      ticketReference: ticket2.reference,
      actor: { name: agent2.name, email: agent2.email, role: agent2.role, id: agent2._id },
      action: 'PUBLIC_REPLY_ADDED',
      description: `Public reply added by ${agent2.name}`,
      createdAt: new Date(now - 8 * HOUR)
    });

    await Activity.create({
      ticket: ticket2._id,
      ticketReference: ticket2.reference,
      actor: { name: agent2.name, email: agent2.email, role: agent2.role, id: agent2._id },
      action: 'TICKET_RESOLVED',
      description: `Ticket resolved by ${agent2.name}`,
      previousValue: 'In Progress',
      newValue: 'Resolved',
      createdAt: resolved6hAgo
    });

    // 3. In Progress Ticket (Created 4 hours ago, High Priority)
    const token3 = createTokenData();
    const created4hAgo = new Date(now - 4 * HOUR);
    const ticket3 = await Ticket.create({
      reference: 'TCK-100803',
      subject: 'Billing duplicate invoice charge for October subscription',
      customerName: 'Stark Industries',
      customerEmail: 'billing@stark.com',
      description: 'We noticed two identical charges of $499 on our invoice statement #INV-9281.',
      priority: 'High',
      status: 'In Progress',
      assignedTo: agent1._id,
      accessTokenHash: token3.hash,
      resolvedAt: null,
      createdAt: created4hAgo,
      updatedAt: new Date(now - 2 * HOUR)
    });

    await Message.create({
      ticket: ticket3._id,
      ticketReference: ticket3.reference,
      type: 'public',
      senderRole: 'agent',
      senderName: agent1.name,
      senderUser: agent1._id,
      content: 'Hello Stark team, we are reviewing your Stripe invoice logs right now to initiate a refund for the duplicate charge.',
      createdAt: new Date(now - 3 * HOUR)
    });

    await Message.create({
      ticket: ticket3._id,
      ticketReference: ticket3.reference,
      type: 'internal',
      senderRole: 'agent',
      senderName: agent1.name,
      senderUser: agent1._id,
      content: 'Verified in Stripe: webhook fired twice due to network retry. Refund pending Stripe review.',
      createdAt: new Date(now - 2.5 * HOUR)
    });

    // 4. Waiting on Customer Ticket (Created 8 hours ago, Medium Priority)
    const token4 = createTokenData();
    const created8hAgo = new Date(now - 8 * HOUR);
    const ticket4 = await Ticket.create({
      reference: 'TCK-100804',
      subject: 'Inability to invite additional team members on Pro Plan',
      customerName: 'Cyberdyne Systems',
      customerEmail: 'admin@cyberdyne.io',
      description: 'The invite button remains disabled even though we have 5 unused seats in our pool.',
      priority: 'Medium',
      status: 'Waiting on Customer',
      assignedTo: agent2._id,
      accessTokenHash: token4.hash,
      resolvedAt: null,
      createdAt: created8hAgo,
      updatedAt: new Date(now - 5 * HOUR)
    });

    await Message.create({
      ticket: ticket4._id,
      ticketReference: ticket4.reference,
      type: 'public',
      senderRole: 'agent',
      senderName: agent2.name,
      senderUser: agent2._id,
      content: 'Could you please send us a screenshot of your browser developer console errors when clicking the invite button?',
      createdAt: new Date(now - 6 * HOUR)
    });

    // 5. Unassigned Open Ticket (Created 2 hours ago, Low Priority)
    const token5 = createTokenData();
    const created2hAgo = new Date(now - 2 * HOUR);
    const ticket5 = await Ticket.create({
      reference: 'TCK-100805',
      subject: 'Request for CSV export format in reports module',
      customerName: 'Umbrella Corp',
      customerEmail: 'analyst@umbrella.com',
      description: 'Would like to request semicolon-delimited CSV exports for European regional Excel compatibility.',
      priority: 'Low',
      status: 'Open',
      assignedTo: null,
      accessTokenHash: token5.hash,
      resolvedAt: null,
      createdAt: created2hAgo,
      updatedAt: created2hAgo
    });

    await Activity.create({
      ticket: ticket5._id,
      ticketReference: ticket5.reference,
      actor: { name: ticket5.customerName, email: ticket5.customerEmail, role: 'customer' },
      action: 'TICKET_CREATED',
      description: `Ticket submitted by ${ticket5.customerName}`,
      createdAt: created2hAgo
    });

    console.log('Seeded sample tickets successfully:');
    console.log(` - TCK-100801: Urgent, Open, Overdue (Created 36h ago) [Token: ${token1.plain}]`);
    console.log(` - TCK-100802: High, Resolved (Created 48h ago, NOT overdue) [Token: ${token2.plain}]`);
    console.log(` - TCK-100803: High, In Progress (Created 4h ago) [Token: ${token3.plain}]`);
    console.log(` - TCK-100804: Medium, Waiting on Customer (Created 8h ago) [Token: ${token4.plain}]`);
    console.log(` - TCK-100805: Low, Open, Unassigned (Created 2h ago) [Token: ${token5.plain}]`);

    console.log('\nDatabase seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();

