import fs from "fs/promises";
import path from "path";
import { User } from "../models/User.js";
import { AVATAR_DIR } from "../middleware/avatarUpload.js";

function publicAvatarPath(userId, ext) {
  return `/uploads/avatars/${userId}${ext}`;
}

async function removeAvatarFilesExcept(userId, keepFilename) {
  let entries;
  try {
    entries = await fs.readdir(AVATAR_DIR);
  } catch {
    return;
  }
  await Promise.all(
    entries
      .filter((name) => name.startsWith(userId) && name !== keepFilename)
      .map((name) => fs.unlink(path.join(AVATAR_DIR, name)).catch(() => {}))
  );
}

async function removeAllAvatarFiles(userId) {
  let entries;
  try {
    entries = await fs.readdir(AVATAR_DIR);
  } catch {
    return;
  }
  await Promise.all(
    entries
      .filter((name) => name.startsWith(userId))
      .map((name) => fs.unlink(path.join(AVATAR_DIR, name)).catch(() => {}))
  );
}

export async function uploadAvatar(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "No image file uploaded (field name: photo)" });
  }
  const ext = path.extname(req.file.filename);
  await removeAvatarFilesExcept(req.user.id, req.file.filename);
  const rel = publicAvatarPath(req.user.id, ext);
  await User.findByIdAndUpdate(req.user.id, { profilePicture: rel });

  const user = await User.findById(req.user.id);
  return res.json({
    profilePicture: user.profilePicture,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      updatedAt: user.updatedAt,
    },
  });
}

export async function deleteAvatar(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  await removeAllAvatarFiles(req.user.id);
  user.profilePicture = null;
  await user.save();
  return res.json({
    profilePicture: null,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      profilePicture: null,
      updatedAt: user.updatedAt,
    },
  });
}
