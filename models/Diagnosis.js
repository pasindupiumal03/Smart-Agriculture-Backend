import mongoose from "mongoose";

const diagnosisSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    userName: {
      type: String,
      required: true,
      default: "Guest User",
    },
    crop: {
      type: String,
      required: true,
    },
    disease: {
      type: String,
      required: true,
    },
    confidence: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["HIGH", "MEDIUM", "LOW"],
      default: "LOW",
    },
    imageUrl: {
      type: String,
      required: false,
    },
    treatmentViewed: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Diagnosis = mongoose.model("Diagnosis", diagnosisSchema);

export default Diagnosis;
