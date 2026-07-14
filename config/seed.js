import User from "../models/User.js";
import Diagnosis from "../models/Diagnosis.js";
import Product from "../models/Product.js";
import bcrypt from "bcryptjs";

export const seedDatabase = async () => {
  console.log("Starting database seeding process...");

  // 1. Seed Admin User
  try {
    const adminEmail = "shehanthisru5@gmail.com";
    const adminPhone = "0771234567";
    const adminExists = await User.findOne({
      $or: [
        { emailAddress: adminEmail },
        { phoneNumber: adminPhone }
      ]
    });

    if (!adminExists) {
      console.log("Seeding admin user...");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Okapathana13023", salt);
      await User.create({
        fullName: "Admin User",
        emailAddress: adminEmail,
        phoneNumber: adminPhone,
        password: hashedPassword,
        location: "Colombo",
        createdAt: new Date("2024-05-24T08:00:00Z")
      });
      console.log("Admin user seeded successfully.");
    } else {
      console.log("Admin user or phone number 0771234567 already exists. Skipping admin seed.");
    }
  } catch (adminErr) {
    console.error("Failed to seed admin user:", adminErr.message);
  }

  // 2. Seed Baseline Users
  const userMap = {};
  try {
    const baselineUsers = [
      { name: "Sunil Perera", email: "sunil@farmer.com", phone: "0770000001", loc: "Kegalle", date: new Date("2024-05-26T10:30:00Z") },
      { name: "Kumara Bandara", email: "kumara@farmer.com", phone: "0770000002", loc: "Kurunegala", date: new Date("2024-05-26T10:15:00Z") },
      { name: "Nimal Silva", email: "nimal@farmer.com", phone: "0770000003", loc: "Matale", date: new Date("2024-05-25T09:45:00Z") },
      { name: "Saman Wickrama", email: "saman@farmer.com", phone: "0770000004", loc: "Anuradhapura", date: new Date("2024-05-25T09:20:00Z") },
      { name: "Ruwan Jayasekara", email: "ruwan@farmer.com", phone: "0770000005", loc: "Polonnaruwa", date: new Date("2024-05-25T09:10:00Z") }
    ];

    for (const u of baselineUsers) {
      let existingUser = await User.findOne({
        $or: [
          { emailAddress: u.email },
          { phoneNumber: u.phone }
        ]
      });

      if (!existingUser) {
        const salt = await bcrypt.genSalt(10);
        const dummyPassword = await bcrypt.hash("FarmerPassword123", salt);
        existingUser = await User.create({
          fullName: u.name,
          emailAddress: u.email,
          phoneNumber: u.phone,
          password: dummyPassword,
          location: u.loc,
          createdAt: u.date
        });
      }
      userMap[u.name] = existingUser._id;
    }
    console.log("Baseline users verification/seeding completed.");
  } catch (usersErr) {
    console.error("Failed to seed baseline users:", usersErr.message);
  }

  // 3. Seed Baseline Diagnoses
  try {
    // Clear old baseline diagnoses to reload them with separate images
    await Diagnosis.deleteMany({ userName: { $in: ["Sunil Perera", "Kumara Bandara", "Nimal Silva", "Saman Wickrama", "Ruwan Jayasekara"] } });
    
    console.log("Seeding baseline diagnoses...");
    const baselineDiagnoses = [
      {
        userName: "Sunil Perera",
        crop: "Paddy",
        disease: "Paddy Blast",
        confidence: "92%",
        status: "HIGH",
        imageUrl: "/images/leaf_blast.png",
        treatmentViewed: true,
        createdAt: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000)
      },
      {
        userName: "Kumara Bandara",
        crop: "Chili",
        disease: "Leaf Curl",
        confidence: "89%",
        status: "HIGH",
        imageUrl: "/images/farmer_phone.png",
        treatmentViewed: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        userName: "Nimal Silva",
        crop: "Tomato",
        disease: "Early Blight",
        confidence: "76%",
        status: "MEDIUM",
        imageUrl: "/images/drone_monitoring.png",
        treatmentViewed: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        userName: "Saman Wickrama",
        crop: "Maize",
        disease: "Common Rust",
        confidence: "68%",
        status: "MEDIUM",
        imageUrl: "/images/greenhouse_tech.png",
        treatmentViewed: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        userName: "Ruwan Jayasekara",
        crop: "Paddy",
        disease: "Brown Spot",
        confidence: "60%",
        status: "LOW",
        imageUrl: "/images/smart_irrigation.png",
        treatmentViewed: true,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      }
    ];

      for (const diag of baselineDiagnoses) {
        await Diagnosis.create({
          userId: userMap[diag.userName] || null,
          userName: diag.userName,
          crop: diag.crop,
          disease: diag.disease,
          confidence: diag.confidence,
          status: diag.status,
          imageUrl: diag.imageUrl,
          treatmentViewed: diag.treatmentViewed,
          createdAt: diag.createdAt
        });
      }
    console.log("Baseline diagnoses seeded successfully.");
  } catch (diagErr) {
    console.error("Failed to seed baseline diagnoses:", diagErr.message);
  }

  // 4. Seed Default Products
  try {
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log("Seeding default marketplace products...");
      const defaultProducts = [
        { name: "Tricyclazole 75% WP", category: "Chemical", price: 1450, description: "Systemic fungicide for control of blast disease in Paddy.", imageUrl: "/images/products/tricyclazole.png" },
        { name: "Isoprothiolane 40% EC", category: "Chemical", price: 1850, description: "Highly effective systemic fungicide for blast control in Paddy.", imageUrl: "/images/products/knapsack_sprayer.png" },
        { name: "Carbendazim 50% WP", category: "Chemical", price: 980, description: "Broad spectrum systemic fungicide for crops.", imageUrl: "/images/products/bacticide.png" },
        { name: "Pseudomonas Fluorescens", category: "Organic", price: 750, description: "Bio-fungicide for control of root rot and leaf blight.", imageUrl: "/images/products/organic_compost.png" },
        { name: "Streptomycin + Tetracycline", category: "Chemical", price: 620, description: "Antibacterial powder for bacterial leaf blight.", imageUrl: "/images/products/insecticide_bottle.png" },
        { name: "Copper Oxychloride 50% WP", category: "Chemical", price: 1200, description: "Fungicide for bacterial diseases and blights.", imageUrl: "/images/products/fertilizer_bag.png" },
        { name: "Mancozeb 75% WP", category: "Chemical", price: 1100, description: "Contact protective fungicide for rust and spots.", imageUrl: "/images/products/chili_seeds.png" },
        { name: "Tebuconazole 250 EC", category: "Chemical", price: 2100, description: "Systemic fungicide for rust and leaf spot control.", imageUrl: "/images/products/sprinkler_kit.png" },
        { name: "Chlorothalonil 75% WP", category: "Chemical", price: 1350, description: "Broad-spectrum contact fungicide for early blight.", imageUrl: "/images/products/garden_hose.png" },
        { name: "Copper Hydroxide 77% WP", category: "Chemical", price: 1600, description: "Preventative fungicide/bactericide for early blight.", imageUrl: "/images/products/hand_trowel.png" },
        { name: "Propiconazole 25% EC", category: "Chemical", price: 1750, description: "Systemic foliar fungicide for anthracnose.", imageUrl: "/images/products/mammoty.png" },
        { name: "Azoxystrobin 23% SC", category: "Chemical", price: 2400, description: "Preventative and curative fungicide for anthracnose.", imageUrl: "/images/products/drip_irrigation.png" }
      ];
      await Product.insertMany(defaultProducts);
      console.log("Marketplace products seeded successfully.");
    } else {
      console.log(`Products collection already has ${productCount} documents. Skipping products seed.`);
    }
  } catch (prodErr) {
    console.error("Failed to seed default marketplace products:", prodErr.message);
  }

  console.log("Database seeding process finished.");
};
