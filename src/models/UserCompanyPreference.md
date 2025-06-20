# UserCompanyPreference Model

This model tracks user preferences for companies, including tracking status and ranking priority.

## Schema Definition

```typescript
interface IUserCompanyPreference extends Document {
	userId: string;
	companyId: mongoose.Schema.Types.ObjectId;
	rank: number; // 1-100, with 100 being highest priority
	isTracking: boolean;
}

const UserCompanyPreferenceSchema = new Schema<IUserCompanyPreference>(
	{
		userId: {
			type: String,
			required: true,
		},
		companyId: {
			type: Schema.Types.ObjectId,
			ref: 'Company',
			required: true,
		},
		rank: {
			type: Number,
			required: true,
			min: 1,
			max: 100,
			default: 50,
		},
		isTracking: {
			type: Boolean,
			required: true,
			default: true,
		},
	},
	{timestamps: true},
);
```

## Indexes

The schema includes two important indexes:

1. A compound unique index on `userId` and `companyId` to ensure a user can only have one preference record per company:

```typescript
UserCompanyPreferenceSchema.index({userId: 1, companyId: 1}, {unique: true});
```

2. An index for efficient querying of tracking preferences by user:

```typescript
UserCompanyPreferenceSchema.index({userId: 1, isTracking: 1, rank: -1});
```

## Usage

This model serves as the source of truth for:

1. Which companies a user is tracking
2. The priority/rank assigned to each company (determines scraping frequency)
3. Historical tracking preferences when `isTracking` is set to false

This model replaces the previous approach of storing tracked companies directly in the User model, allowing for better scalability and more detailed preferences.

## Important Properties

- `userId`: The ID of the user who owns this preference
- `companyId`: Reference to the Company model
- `rank`: A number from 1-100 representing the priority/importance of this company to the user (higher = more frequent updates)
- `isTracking`: Boolean indicating whether the user is actively tracking this company

## Related Services

See `UserCompanyPreferenceService` for business logic related to this model.
