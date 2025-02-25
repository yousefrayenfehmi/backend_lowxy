import { Router, Request, Response } from 'express';
import passport from 'passport';
const router = Router();

// Routes Google
router.get('/auth/google/chauffeur', (req, res) => {
  res.cookie('userRole', 'chauffeur', { 
    httpOnly: true,
    maxAge: 5 * 60 * 1000
  });
  res.redirect('/auth/google');
});

router.get('/auth/google/touriste', (req, res) => {
  res.cookie('userRole', 'touriste', { 
    httpOnly: true,
    maxAge: 5 * 60 * 1000
  });
  res.redirect('/auth/google');
});

router.get('/auth/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.clearCookie('userRole');
    // Reste du code...
  }
);

// Routes Facebook - clairement séparées
router.get('/auth/facebook/chauffeur', (req, res) => {
  res.cookie('userRole', 'chauffeur', { 
    httpOnly: true,
    maxAge: 5 * 60 * 1000
  });
  res.redirect('/auth/facebook');
});

router.get('/auth/facebook/touriste', (req, res) => {
  res.cookie('userRole', 'touriste', { 
    httpOnly: true,
    maxAge: 5 * 60 * 1000
  });
  res.redirect('/auth/facebook');
});

router.get('/auth/facebook', 
  passport.authenticate('facebook', { scope: ['email', 'public_profile'] })
);

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    res.clearCookie('userRole');
    // Reste du code...
  }
);

export default router;