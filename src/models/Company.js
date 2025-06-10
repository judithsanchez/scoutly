"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Company = exports.WorkModel = void 0;
var mongoose_1 = require("mongoose");
var WorkModel;
(function (WorkModel) {
    WorkModel["FULLY_REMOTE"] = "FULLY_REMOTE";
    WorkModel["HYBRID"] = "HYBRID";
    WorkModel["IN_OFFICE"] = "IN_OFFICE";
})(WorkModel || (exports.WorkModel = WorkModel = {}));
var CompanySchema = new mongoose_1.Schema({
    companyID: {
        type: String,
        required: true,
        unique: true,
    },
    company: {
        type: String,
        required: true,
    },
    careers_url: {
        type: String,
        required: true,
    },
    selector: {
        type: String,
        default: '',
    },
    work_model: {
        type: String,
        enum: Object.values(WorkModel),
        required: true,
    },
    headquarters: {
        type: String,
        required: true,
    },
    office_locations: [
        {
            type: String,
        },
    ],
    fields: [
        {
            type: String,
        },
    ],
    openToApplication: {
        type: Boolean,
        default: false,
        required: true,
    },
    lastSuccessfulScrape: {
        type: Date,
    },
    isProblematic: {
        type: Boolean,
        default: false,
    },
    scrapeErrors: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'ScrapeError',
        },
    ],
    ranking: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
        required: true,
    },
}, {
    timestamps: true,
});
// Create compound index for error tracking
CompanySchema.index({ isProblematic: 1, lastSuccessfulScrape: 1 });
// Check if model exists before compiling
exports.Company = mongoose_1.default.models.Company || mongoose_1.default.model('Company', CompanySchema);
