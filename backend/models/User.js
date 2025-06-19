const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  badge: {
  type: Object,
  default: {}
},
  profile: {
    fullname: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    dob: {
      type: Date,
      required: true
    },
    dyslexiaType: {
      type: String,
      enum: ['auditory', 'phonological', 'visual', 'math', 'memory', 'mixed', null],
      default: null
    },
    // In your UserSchema (user.js)
    badges: {
      type: Map,
      of: Number,
      default: () => new Map([
        ['auditory', 0],
        ['phonological', 0],
        ['visual', 0], 
        ['math', 0],
        ['memory', 0]
      ])
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.updateBadge = async function(dyslexiaType, level) {
  if (!this.badges.has(dyslexiaType)) {
    throw new Error('Invalid dyslexia type');
  }
  
  // Only update if new level is higher than current
  if (level > this.badges.get(dyslexiaType)) {
    this.badges.set(dyslexiaType, level);
    await this.save();
  }
  
  return this.badges.get(dyslexiaType);
};

module.exports = mongoose.model('User', UserSchema);