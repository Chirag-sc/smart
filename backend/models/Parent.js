const mongoose = require('mongoose');
const User = require('./User');

const ParentSchema = new mongoose.Schema({
  childUSN: {
    type: String,
    required: [true, 'Please provide child USN'],
    trim: true
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }]
});

// Create a Parent model that extends the User model
const Parent = User.discriminator('Parent', ParentSchema);

module.exports = Parent; 