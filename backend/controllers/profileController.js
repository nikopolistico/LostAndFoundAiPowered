import pool from "../db.js";

export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      "SELECT * FROM user_profiles WHERE user_id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { full_name, user_type, department, contact_number, birthday, profile_picture } = req.body;

    const result = await pool.query(
      `UPDATE user_profiles
       SET full_name=$1, user_type=$2, department=$3, contact_number=$4, birthday=$5, profile_picture=$6, updated_at=NOW()
       WHERE user_id=$7 RETURNING *`,
      [full_name, user_type, department, contact_number, birthday, profile_picture, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
