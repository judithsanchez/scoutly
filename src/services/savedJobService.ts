import {SavedJob} from '@/models/SavedJob';

export class SavedJobService {
	static async getSavedJobsByEmail(email: string) {
		return SavedJob.find({email});
	}

	static async getAllSavedJobs() {
		return SavedJob.find({});
	}

	static async updateSavedJobStatus(id: string, status: string) {
		return SavedJob.findByIdAndUpdate(id, {status}, {new: true});
	}

	static async createSavedJob(data: Record<string, any>) {
		const job = new SavedJob(data);
		await job.save();
		return job;
	}

	static async getSavedJobById(id: string) {
		return SavedJob.findById(id);
	}
}
