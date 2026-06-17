import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.model';
import { logger } from '../utils/logger';

export const configurePassport = (): void => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
        scope: [
          'profile',
          'email',
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
        ],
      },
      async (_accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails?.[0]?.value || '',
              profileImage: profile.photos?.[0]?.value || '',
              role: 'candidate',
              refreshToken,
              lastLogin: new Date(),
            });
            logger.info(`New user created: ${user.email}`);
          } else {
            user.lastLogin = new Date();
            if (refreshToken) user.refreshToken = refreshToken;
            await user.save();
          }

          return done(null, user);
        } catch (error) {
          logger.error('Google OAuth error:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
