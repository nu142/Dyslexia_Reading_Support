const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
  const { fullname, email, dob, username, password, confirmPassword } = req.body;

  // Validation
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    // Check if username or email already exists
    const existingUser = await User.findOne({ 
      $or: [
        { username },
        { 'profile.email': email }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.username === username 
          ? 'Username already taken' 
          : 'Email already registered'
      });
    }

    // Create new user
    const newUser = new User({
      username,
      password,
      profile: {
        fullname,
        email,
        dob: new Date(dob)
      }
    });

    await newUser.save();

    // Return user data without password
    const userResponse = {
      username: newUser.username,
      badge: newUser.badge,
      profile: newUser.profile
    };

    res.status(201).json({ 
      message: 'User registered successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login Route
// Make sure you have this in your auth routes
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Always set content-type header
    res.setHeader('Content-Type', 'application/json');

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ 
      success: true,
      badge: user.badge 
    });
    
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
// Badge Update Route
router.post('/update-badge', async (req, res) => {
  const { username, badge } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { username },
      { badge },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ 
      message: 'Badge updated successfully',
      badge: user.badge
    });
  } catch (error) {
    console.error('Badge update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;