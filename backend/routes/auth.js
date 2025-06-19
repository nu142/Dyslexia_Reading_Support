const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const router = express.Router();

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


// Login Route (simplified)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    res.json({ 
      success: true,
      username: user.username,
      badge: user.badge,
      profile: user.profile
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
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
    res.json({ success: true, badge: user.badge });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Update failed' });
  }
});


  

// Complete Level Route
 router.post('/complete-level', async (req, res) => {
  console.log('[Complete-Level] Request received:', req.body); // Log incoming request

  try {
    const { username, dyslexiaType, level } = req.body;

    // Validate input
    if (!username || !dyslexiaType || level === undefined) {
      console.error('[Complete-Level] Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: username, dyslexiaType, level' 
      });
    }

    if (!['auditory', 'phonological', 'visual', 'math', 'memory'].includes(dyslexiaType)) {
      console.error('[Complete-Level] Invalid dyslexia type:', dyslexiaType);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid dyslexia type' 
      });
    }

    console.log(`[Complete-Level] Processing for ${username}, type: ${dyslexiaType}, level: ${level}`);

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      console.error('[Complete-Level] User not found:', username);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log('[Complete-Level] User found:', user.username);

    // Initialize badges/completedLevels if they don't exist
    if (!user.badge) {
      console.log('[Complete-Level] Initializing badge object');
      user.badge = {};
    }
    if (!user.profile.completedLevels) {
      console.log('[Complete-Level] Initializing completedLevels object');
      user.profile.completedLevels = {};
    }

    // Get current level
    const currentLevel = user.profile.completedLevels[dyslexiaType] || 0;
    console.log(`[Complete-Level] Current level for ${dyslexiaType}: ${currentLevel}`);

    // Only update if new level is higher than current
    if (level > currentLevel) {
      console.log(`[Complete-Level] Updating level from ${currentLevel} to ${level}`);
      user.profile.completedLevels[dyslexiaType] = level;
      user.badge[dyslexiaType] = level;
      user.markModified('badge');
      user.markModified('profile.completedLevels');
      await user.save();
      try {
        await user.save();
        console.log('[Complete-Level] User saved successfully');
      } catch (saveError) {
        console.error('[Complete-Level] Error saving user:', saveError);
        throw new Error('Failed to save user progress');
      }
    } else {
      console.log('[Complete-Level] No update needed (new level not higher)');
    }

    // Prepare response
    const badges = { ...user.badge };
    const completedLevels = { ...user.profile.completedLevels };

    console.log('[Complete-Level] Success response:', { 
      badges, 
      completedLevels 
    });

    res.json({
      success: true,
      badges,
      completedLevels
    });

  } catch (error) {
    console.error('[Complete-Level] System error:', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user data
router.get('/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).lean();
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    // Remove sensitive data
    delete user.password;
    delete user.__v;
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
