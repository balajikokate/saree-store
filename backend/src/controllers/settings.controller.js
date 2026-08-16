const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../middleware/errorHandler");
const { settingsSchema } = require("../utils/validators");

const SINGLETON_ID = "singleton";

// GET /api/settings — public, the storefront needs this on every page load
// to know which color theme to render.
const getSettings = asyncHandler(async (req, res) => {
  const settings = await prisma.storeSetting.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  });
  res.json({ success: true, data: { theme: settings.theme } });
});

// PATCH /api/admin/settings
const updateSettings = asyncHandler(async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid settings", parsed.error.flatten());

  const settings = await prisma.storeSetting.upsert({
    where: { id: SINGLETON_ID },
    update: { theme: parsed.data.theme },
    create: { id: SINGLETON_ID, theme: parsed.data.theme },
  });
  res.json({ success: true, data: { theme: settings.theme } });
});

module.exports = { getSettings, updateSettings };
