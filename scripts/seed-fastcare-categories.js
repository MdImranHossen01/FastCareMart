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

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    image: { type: String },
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

const categories = [
  { name: 'Maternity & Motherhood',      slug: 'motherhood-maternity',   image: '/assets/images/cagetory/motherhood_maternity.webp',    isActive: true },
  { name: 'Family & Personal Wellness',  slug: 'personal-wellness',      image: '/assets/images/cagetory/personal_wellness.webp',       isActive: true },
  { name: 'Baby Diapering & Hygiene',    slug: 'baby-diapering-hygiene', image: '/assets/images/cagetory/baby_diapering_hygiene.webp',  isActive: true },
  { name: 'Diagnostic Devices',          slug: 'diagnostic-devices',     image: '/assets/images/cagetory/diagnostic_devices.webp',      isActive: true },
  { name: 'Clinic & Hospital Supplies',  slug: 'clinic-supplies',        image: '/assets/images/cagetory/clinic_supplies.webp',         isActive: true },
  { name: 'Surgical Instruments',        slug: 'surgical-instruments',   image: '/assets/images/cagetory/surgical_instruments.webp',    isActive: true },
  { name: 'OTC & Daily Healthcare',      slug: 'otc-healthcare',         image: '/assets/images/cagetory/otc_healthcare.webp',          isActive: true },
  { name: 'Prescription Medicines',      slug: 'prescription-medicines', image: '/assets/images/cagetory/prescription_medicines.webp',  isActive: true },
];

async function seed() {
  try {
    await mongoose.connect(mongodbUri);
    console.log('Connected to MongoDB successfully.');

    let inserted = 0, updated = 0, skipped = 0;

    for (const cat of categories) {
      const existing = await Category.findOne({ slug: cat.slug });
      if (existing) {
        if (existing.image !== cat.image || existing.name !== cat.name) {
          await Category.updateOne({ slug: cat.slug }, { $set: { image: cat.image, name: cat.name, isActive: cat.isActive } });
          console.log('[UPDATED]  ' + cat.name + ' -> ' + cat.image);
          updated++;
        } else {
          console.log('[SKIPPED]  ' + cat.name + ' (already up-to-date)');
          skipped++;
        }
      } else {
        await Category.create(cat);
        console.log('[INSERTED] ' + cat.name + ' -> ' + cat.image);
        inserted++;
      }
    }

    console.log('\n===== Seeding Complete =====');
    console.log('Inserted : ' + inserted);
    console.log('Updated  : ' + updated);
    console.log('Skipped  : ' + skipped);

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

seed();
