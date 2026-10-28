export const validateTicketInput = (req, res, next) => {
  const { subject, customerName, customerEmail, description } = req.body;
  const errors = [];

  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    errors.push('Ticket subject is required');
  } else if (subject.trim().length > 200) {
    errors.push('Ticket subject cannot exceed 200 characters');
  }

  if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
    errors.push('Customer name is required');
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!customerEmail || typeof customerEmail !== 'string' || !emailRegex.test(customerEmail.trim())) {
    errors.push('A valid customer email address is required');
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Ticket description is required');
  }

  if (req.body.priority && !['Low', 'Medium', 'High', 'Urgent'].includes(req.body.priority)) {
    errors.push('Priority must be one of: Low, Medium, High, Urgent');
  }

  if (req.body.status && !['Open', 'In Progress', 'Waiting on Customer', 'Resolved'].includes(req.body.status)) {
    errors.push('Status must be one of: Open, In Progress, Waiting on Customer, Resolved');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

export const validateMessageInput = (req, res, next) => {
  const { content, type } = req.body;
  const errors = [];

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    errors.push('Message content cannot be empty');
  }

  if (type && !['public', 'internal'].includes(type)) {
    errors.push('Message type must be either "public" or "internal"');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

export const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

export const validateAgentInput = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Agent name is required');
  }

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (role && !['admin', 'agent'].includes(role)) {
    errors.push('Role must be either "admin" or "agent"');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

