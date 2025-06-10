'use client';

import React from 'react';
import {CandidateForm} from '@/components/form/CandidateForm';
import type {CandidateData} from '@/components/form/types';

const DEFAULT_CANDIDATE_DATA = {
	cvUrl:
		'https://drive.google.com/file/d/1-0NUsEx0HmnTmcpMOjGSKdOJJ1Vd_uWL/view?usp=drive_link',
	candidateInfo: {
		logistics: {
			currentResidence: {
				city: 'Utrecht',
				country: 'Netherlands',
				countryCode: 'NL',
				timezone: 'Europe/Amsterdam',
			},
			willingToRelocate: true,
			workAuthorization: [
				{
					region: 'European Union',
					regionCode: 'EU',
					status: 'Citizen',
				},
			],
		},
		languages: [
			{language: 'Spanish', level: 'C2'},
			{language: 'English', level: 'C1'},
			{language: 'Dutch', level: 'B1'},
		],
		preferences: {
			careerGoals: [
				'Work with a modern tech stack like Next.js and Tailwind CSS',
				'Transition into a Senior Engineer role',
				'Contribute to a high-impact, user-facing product',
			],
			jobTypes: ['Full-time', 'Part-time'],
			workEnvironments: ['Remote', 'Hybrid'],
			companySizes: ['Start-ups', 'Mid-size (51-1000)', 'Large (1001+)'],
			exclusions: {
				industries: ['Gambling', 'Defense Contracting'],
				technologies: ['PHP', 'WordPress', 'jQuery'],
				roleTypes: [
					'100% on-call support',
					'Roles with heavy project management duties',
				],
			},
		},
	},
};

export default function ProfilePage() {
	const handleFormSubmit = (formData: CandidateData) => {
		const requestBody = {
			credentials: {
				// This will be replaced by the actual email from auth
				gmail: 'judithv.sanchezc@gmail.com',
			},
			companyNames: ['Booking'], // For now hardcoded to match example
			cvUrl: formData.cvUrl,
			candidateInfo: formData.candidateInfo,
		};

		console.log('--- Form Submitted ---');
		console.log('Final Request Body:', JSON.stringify(requestBody, null, 2));
		alert('Form data prepared! Check the console for the final request body.');
	};

	return (
		<div className="bg-slate-950 text-white min-h-screen">
			<div className="background-glows fixed inset-0 z-0"></div>
			<main className="relative z-10 max-w-4xl mx-auto pt-32 pb-24 px-4">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
						Create Your Candidate Profile
					</h1>
					<p className="text-slate-400">
						Fill out your details below to get personalized job matches.
					</p>
				</div>
				<CandidateForm
					initialData={DEFAULT_CANDIDATE_DATA}
					onFormSubmit={handleFormSubmit}
				/>
			</main>
		</div>
	);
}
