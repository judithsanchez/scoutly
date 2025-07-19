import {SavedJob} from '@/models/SavedJob';

export class SavedJobService {
	static async getSavedJobsByUserId(userId: string) {
		const jobs = await SavedJob.find({userId}).populate({
			path: 'companyId',
			select: 'company companyID careers_url',
		});
		return jobs.map(job => {
			const jobObj = job.toObject();
			jobObj.company = jobObj.companyId;
			return jobObj;
		});
	}

	static async getAllSavedJobs() {
		const jobs = await SavedJob.find({}).populate({
			path: 'companyId',
			select: 'company companyID careers_url',
		});
		return jobs.map(job => {
			const jobObj = job.toObject();
			jobObj.company = jobObj.companyId;
			return jobObj;
		});
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
