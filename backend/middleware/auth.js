import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware to authenticate Google ID token
export const authenticateGoogle = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

  const token = authHeader.split(" ")[1]; // Bearer <Google ID token>
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    req.user = ticket.getPayload(); // contains email, name, picture, etc.
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid Google token" });
  }
};
