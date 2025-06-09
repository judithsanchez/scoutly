# API Request Samples

## POST /api/users

```json
{
	"email": "user@example.com"
}
```

## POST /api/jobs

```json
{
	"credentials": {
		"gmail": "user@gmail.com"
	},
	"companyNames": ["toptal"],
	"cvUrl": "https://drive.google.com/file/d/your-cv-id/view",
	"candidateInfo": {
		"logistics": {
			"currentResidence": {
				"city": "Utrecht",
				"country": "Netherlands",
				"countryCode": "NL",
				"timezone": "Europe/Amsterdam"
			},
			"willingToRelocate": true,
			"workAuthorization": [
				{
					"region": "European Union",
					"regionCode": "EU",
					"status": "Citizen"
				}
			]
		},
		"languages": [
			{
				"language": "Spanish",
				"level": "C2"
			},
			{
				"language": "English",
				"level": "C1"
			},
			{
				"language": "Dutch",
				"level": "B1"
			}
		],
		"preferences": {
			"careerGoals": [
				"Work with a modern tech stack like Next.js and Tailwind CSS",
				"Transition into a Senior Engineer role",
				"Contribute to a high-impact, user-facing product"
			],
			"jobTypes": ["Full-time", "Part-time"],
			"workEnvironments": ["Remote", "Hybrid"],
			"companySizes": ["Start-ups", "Mid-size (51-1000)", "Large (1001+)"],
			"exclusions": {
				"industries": ["Gambling", "Defense Contracting"],
				"technologies": ["PHP", "WordPress", "jQuery"],
				"roleTypes": [
					"100% on-call support",
					"Roles with heavy project management duties"
				]
			}
		}
	}
}
```

Note: Currently, the API endpoints do not implement authentication. The `credentials.gmail` field is used only for tracking purposes.
