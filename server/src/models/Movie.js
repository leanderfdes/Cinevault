const mongoose = require("mongoose");

const MovieSchema = new mongoose.Schema(
  {
    imdbId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: true },
    lists: { type: [String], default: [], index: true },
    description: { type: String, default: "" },
    rating: { type: Number, default: null, index: true },
    releaseDate: { type: Date, default: null, index: true },
    durationMins: { type: Number, default: null, index: true },
    posterUrl: { type: String, default: "" }
  },
  { timestamps: true }
);

// Search by name/description
MovieSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Movie", MovieSchema);
