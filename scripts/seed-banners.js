const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env.local file to get MONGODB_URI
const envPath = path.join(__dirname, '../.env.local');
let mongodbUri = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^MONGODB_URI=(.*)$/m);
  if (match && match[1]) {
    mongodbUri = match[1].trim().replace(/['"]/g, '');
  }
}

if (!mongodbUri) {
  console.error('ERROR: MONGODB_URI not found in .env.local');
  process.exit(1);
}

console.log('Connecting to MongoDB...');

const BannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    image: { type: String, required: true },
    link: { type: String },
    primaryBtnText: { type: String },
    primaryBtnLink: { type: String },
    secondaryBtnText: { type: String },
    secondaryBtnLink: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Banner = mongoose.models.Banner || mongoose.model('Banner', BannerSchema);

const banners = [
  {
    title: 'Prescription & Pharmacy Delivery',
    image: '/assets/images/Banner/Prescription-Pharmacy-Delivery.webp',
    link: '/shop',
    primaryBtnText: 'Shop Now',
    primaryBtnLink: '/shop',
    secondaryBtnText: 'Contact Us',
    secondaryBtnLink: '/contact',
    order: 1,
    isActive: true,
  },
  {
    title: 'Daily Wellness & Vitality Boosters',
    image: '/assets/images/Banner/Daily-Wellness-Vitality-Boosters.webp',
    link: '/shop',
    primaryBtnText: 'Shop Now',
    primaryBtnLink: '/shop',
    secondaryBtnText: 'Contact Us',
    secondaryBtnLink: '/contact',
    order: 2,
    isActive: true,
  },
  {
    title: 'Advanced Diagnostic Devices',
    image: '/assets/images/Banner/Advanced-Diagnostic-Devices.webp',
    link: '/shop',
    primaryBtnText: 'Shop Now',
    primaryBtnLink: '/shop',
    secondaryBtnText: 'Contact Us',
    secondaryBtnLink: '/contact',
    order: 3,
    isActive: true,
  },
  {
    title: 'Premium Baby Nutrition & Care',
    image: '/assets/images/Banner/Premium-Baby-Nutrition-Care.webp',
    link: '/shop',
    primaryBtnText: 'Shop Now',
    primaryBtnLink: '/shop',
    secondaryBtnText: 'Contact Us',
    secondaryBtnLink: '/contact',
    order: 4,
    isActive: true,
  },
  {
    title: 'Maternity & Motherhood Care',
    image: '/assets/images/Banner/Maternity-Motherhood-Care.webp',
    link: '/shop',
    primaryBtnText: 'Shop Now',
    primaryBtnLink: '/shop',
    secondaryBtnText: 'Contact Us',
    secondaryBtnLink: '/contact',
    order: 5,
    isActive: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(mongodbUri);
    console.log('Connected to MongoDB successfully.');

    // Clear existing banners
    const deleteResult = await Banner.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing banners.`);

    // Insert new banners
    const insertResult = await Banner.insertMany(banners);
    console.log(`Seeded ${insertResult.length} banners successfully:`);
    insertResult.forEach((b, i) => {
      console.log(`[Banner ${i + 1}] Title: "${b.title}", Image: "${b.image}"`);
    });

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

seed();
