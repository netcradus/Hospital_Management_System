import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendSuccess } from "../utils/responseHandler.js";

export default function createCrudController(Model, label, populate = "") {
  return {
    list: asyncHandler(async (req, res) => {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 10);
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        Model.find().populate(populate).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Model.countDocuments(),
      ]);

      sendSuccess(res, `${label} fetched successfully`, {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }),

    create: asyncHandler(async (req, res) => {
      const item = await Model.create(req.body);
      sendSuccess(res, `${label} created successfully`, item, 201);
    }),

    getById: asyncHandler(async (req, res) => {
      const item = await Model.findById(req.params.id).populate(populate);
      if (!item) {
        throw new ApiError(404, `${label} not found`);
      }
      sendSuccess(res, `${label} fetched successfully`, item);
    }),

    update: asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate(populate);

      if (!item) {
        throw new ApiError(404, `${label} not found`);
      }

      sendSuccess(res, `${label} updated successfully`, item);
    }),

    remove: asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) {
        throw new ApiError(404, `${label} not found`);
      }
      sendSuccess(res, `${label} deleted successfully`, item);
    }),
  };
}

