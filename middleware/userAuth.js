import jwt from "jsonwebtoken";

export const userAuth = async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized!!!!!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.userId) {
      // make sure req.body exists before setting
      if (!req.body) req.body = {};
      req.body.userId = decoded.userId; // ✅ attach to body
    } else {
      return res.status(401).json({
        success: false,
        message: "Not Authorized. Login Again",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized Access",
      error: error.message,
    });
  }
};
