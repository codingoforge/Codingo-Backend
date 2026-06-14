export const getMe = (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};