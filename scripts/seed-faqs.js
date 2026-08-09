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
  mongodbUri = 'mongodb+srv://fastcaremart:ymRjwTMh8LzaUfsT@cluster0.37cirsi.mongodb.net/fastcaremart';
}

console.log('Connecting to MongoDB...');

const FAQSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const FAQ = mongoose.models.FAQ || mongoose.model('FAQ', FAQSchema);

const faqs = [
  {
    question: 'What type of products does Fast Care Mart offer?',
    answer: 'Fast Care Mart offers a wide range of healthcare and medical products including prescription medicines, OTC & daily healthcare items, diagnostic devices, surgical instruments, baby nutrition & care products, maternity & motherhood essentials, and clinic & hospital supplies.',
    order: 1,
    isActive: true,
  },
  {
    question: 'Are the medicines and healthcare products on Fast Care Mart authentic?',
    answer: 'Yes, absolutely. All products listed on Fast Care Mart are sourced directly from licensed manufacturers and authorized distributors. We strictly follow government regulations and quality standards to ensure every product is 100% genuine and safe.',
    order: 2,
    isActive: true,
  },
  {
    question: 'What are the delivery charges and how long does delivery take?',
    answer: 'Delivery within Dhaka city takes 24 to 48 hours with a shipping fee of 60 BDT. For locations outside Dhaka, shipping is 120 BDT and delivery takes 2 to 5 business days. Free delivery is available on orders above a minimum amount.',
    order: 3,
    isActive: true,
  },
  {
    question: 'Can I return or exchange a product if I receive the wrong item?',
    answer: 'Yes. If you receive a wrong, damaged, or expired product, you can request a return or exchange within 7 days of delivery. Please contact our support team with your order details and photos of the item. Note that medicines and healthcare consumables cannot be returned once opened for safety reasons.',
    order: 4,
    isActive: true,
  },
  {
    question: 'Do I need a prescription to order medicines from Fast Care Mart?',
    answer: 'For OTC (over-the-counter) medicines and general healthcare products, no prescription is required. However, for prescription-only medicines, you will need to upload a valid doctor\'s prescription at the time of placing your order. Our pharmacists verify all prescriptions before processing.',
    order: 5,
    isActive: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(mongodbUri);
    console.log('Connected to MongoDB successfully.');

    // Clear existing FAQs
    const deleteResult = await FAQ.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing FAQs.`);

    // Insert new FAQs
    const insertResult = await FAQ.insertMany(faqs);
    console.log(`Seeded ${insertResult.length} FAQs successfully:`);
    insertResult.forEach((f, i) => {
      console.log(`[FAQ ${i + 1}] Question: "${f.question}"`);
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
