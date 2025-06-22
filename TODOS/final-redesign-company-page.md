'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from 'next-themes';
import { Sun, Moon, Plus, LayoutGrid, Home, Building, Building2, Pencil, Check, X, Info } from 'lucide-react';

// --- MOCKED DATA AND DEPENDENCIES ---

// From: src/types/company.ts
enum WorkModel {
FULLY_REMOTE = 'FULLY_REMOTE',
HYBRID = 'HYBRID',
IN_OFFICE = 'IN_OFFICE',
}

interface ICompany {
\_id: string;
companyID: string;
company: string;
careers_url: string;
selector: string;
work_model: WorkModel;
headquarters: string;
office_locations: string[];
fields: string[];
openToApplication: boolean;
lastSuccessfulScrape?: Date;
isProblematic: boolean;
scrapeErrors: string[];
createdAt?: Date;
updatedAt?: Date;
userPreference?: {
rank: number;
isTracking: boolean;
};
}

interface CreateCompanyInput {
companyID: string;
company: string;
careers_url: string;
work_model: WorkModel;
headquarters: string;
fields: string[];
office_locations?: string[];
selector?: string;
openToApplication?: boolean;
}

// Mock Data
const mockCompanies: ICompany[] = [
{ \_id: '1', companyID: 'google', company: 'Google', careers_url: '#', selector: '', work_model: WorkModel.HYBRID, headquarters: 'Mountain View, CA', office_locations: [], fields: ['Search', 'AI', 'Cloud'], openToApplication: true, isProblematic: false, scrapeErrors: [] },
{ \_id: '2', companyID: 'meta', company: 'Meta', careers_url: '#', selector: '', work_model: WorkModel.HYBRID, headquarters: 'Menlo Park, CA', office_locations: [], fields: ['Social Media', 'VR'], openToApplication: true, isProblematic: false, scrapeErrors: [] },
{ \_id: '3', companyID: 'amazon', company: 'Amazon', careers_url: '#', selector: '', work_model: WorkModel.IN_OFFICE, headquarters: 'Seattle, WA', office_locations: [], fields: ['E-commerce', 'Cloud'], openToApplication: true, isProblematic: false, scrapeErrors: [] },
{ \_id: '4', companyID: 'netflix', company: 'Netflix', careers_url: '#', selector: '', work_model: WorkModel.HYBRID, headquarters: 'Los Gatos, CA', office_locations: [], fields: ['Streaming', 'Entertainment'], openToApplication: true, isProblematic: false, scrapeErrors: [] },
{ \_id: '5', companyID: 'scoutly', company: 'Scoutly', careers_url: '#', selector: '', work_model: WorkModel.FULLY_REMOTE, headquarters: 'Remote', office_locations: [], fields: ['AI', 'Recruiting'], openToApplication: true, isProblematic: false, scrapeErrors: [] },
{ \_id: '6', companyID: 'toptal', company: 'Toptal', careers_url: '#', selector: '', work_model: WorkModel.FULLY_REMOTE, headquarters: 'Remote', office_locations: [], fields: ['Freelance Platform'], openToApplication: true, isProblematic: false, scrapeErrors: [] },
];

let mockTrackedCompanies: ICompany[] = [
{ ...mockCompanies[0], userPreference: { rank: 90, isTracking: true } },
{ ...mockCompanies[4], userPreference: { rank: 80, isTracking: true } },
];

// From: src/hooks/useCompanies.ts (Modified for mock data)
function useCompanies() {
const queryClient = useQueryClient();

    const companiesQuery = useQuery<ICompany[], Error>({
    	queryKey: ['companies'],
    	queryFn: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return mockCompanies;
        },
    });

    const trackedCompaniesQuery = useQuery<ICompany[], Error>({
    	queryKey: ['trackedCompanies'],
    	queryFn: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return mockTrackedCompanies;
        },
    });

    const trackCompanyMutation = useMutation({
    	mutationFn: async ({ companyId, rank = 75 }: { companyId: string, rank?: number }) => {
            const companyToTrack = mockCompanies.find(c => c.companyID === companyId);
            if (companyToTrack && !mockTrackedCompanies.some(c => c.companyID === companyId)) {
                mockTrackedCompanies.push({ ...companyToTrack, userPreference: { rank, isTracking: true } });
            }
            await new Promise(resolve => setTimeout(resolve, 300));
            return { success: true };
    	},
    	onSuccess: () => {
    		queryClient.invalidateQueries({ queryKey: ['trackedCompanies'] });
    	},
    });

    const untrackCompanyMutation = useMutation({
    	mutationFn: async (companyId: string) => {
            mockTrackedCompanies = mockTrackedCompanies.filter(c => c.companyID !== companyId);
            await new Promise(resolve => setTimeout(resolve, 300));
            return { success: true };
        },
    	onSuccess: () => {
    		queryClient.invalidateQueries({ queryKey: ['trackedCompanies'] });
    	},
    });

    const updateRankingMutation = useMutation({
    	mutationFn: async ({ companyId, rank }: { companyId: string, rank: number }) => {
            mockTrackedCompanies = mockTrackedCompanies.map(c =>
                c.companyID === companyId ? { ...c, userPreference: { ...c.userPreference!, rank } } : c
            );
            await new Promise(resolve => setTimeout(resolve, 300));
            return { success: true };
        },
    	onSuccess: () => {
    		queryClient.invalidateQueries({ queryKey: ['trackedCompanies'] });
    	},
    });

    const createCompanyMutation = useMutation({
        mutationFn: async (companyData: CreateCompanyInput) => {
            const newCompany: ICompany = {
                _id: String(Date.now()),
                ...companyData,
                isProblematic: false,
                scrapeErrors: []
            };
            mockCompanies.push(newCompany);
            await new Promise(resolve => setTimeout(resolve, 500));
            return { success: true, company: newCompany };
        },
    	onSuccess: () => {
    		queryClient.invalidateQueries({ queryKey: ['companies'] });
            queryClient.invalidateQueries({ queryKey: ['trackedCompanies'] });
    	},
    });

    return {
    	companies: companiesQuery.data || [],
    	trackedCompanies: trackedCompaniesQuery.data || [],
    	isLoading: companiesQuery.isLoading || trackedCompaniesQuery.isLoading,
    	isError: companiesQuery.isError || trackedCompaniesQuery.isError,
    	error: companiesQuery.error || trackedCompaniesQuery.error,
        trackCompany: trackCompanyMutation.mutateAsync,
        untrackCompany: untrackCompanyMutation.mutateAsync,
        updateRanking: updateRankingMutation.mutateAsync,
        createCompany: createCompanyMutation.mutateAsync,
    };

}

// --- THEME TOGGLE COMPONENT ---
const ThemeToggle = () => {
const { theme, setTheme } = useTheme();
const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="fixed top-6 right-6 z-50 p-2 rounded-full bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--card-border)] shadow-md hover:text-[var(--text-primary)] transition-colors"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <Sun size={20} />
            ) : (
                <Moon size={20} />
            )}
        </button>
    );

};

// --- FORM HELPER COMPONENTS ---
const InputField = ({ label, name, helpText, ...props }: any) => (
<div>
<label htmlFor={name} className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label}</label>
<input id={name} name={name} {...props} className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500" />
{helpText && <p className="text-xs text-[var(--text-secondary)] mt-1">{helpText}</p>}
</div>
);
const SelectField = ({ label, name, options, ...props }: any) => (
<div>
<label htmlFor={name} className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label}</label>
<select id={name} name={name} {...props} className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500">
{options.map((o: string) => <option key={o} value={o}>{o.replace(/_/g, ' ').charAt(0).toUpperCase() + o.slice(1).toLowerCase().replace(/_/g, ' ')}</option>)}
</select>
</div>
);
const CheckboxField = ({ label, ...props }: any) => (
<label className="flex items-center cursor-pointer">
<input type="checkbox" {...props} className="h-4 w-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500" />
<span className="ml-2 text-sm text-[var(--text-primary)]">{label}</span>
</label>
);
const RangeField = ({ label, value, ...props }: any) => (
<div>
<label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label}: {value}</label>
<input type="range" min="0" max="100" value={value} {...props} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
<div className="flex justify-between mt-1 text-xs text-slate-500">
<span>0</span>
<span>100</span>
</div>
</div>
);

// From: src/components/AddCompanyModal.tsx (Redesigned)
function AddCompanyModal({ isOpen, onClose, onAddCompany, }: {
isOpen: boolean;
onClose: () => void;
onAddCompany: (companyData: CreateCompanyInput, track: boolean, ranking: number) => Promise<void>;
}) {
const [companyData, setCompanyData] = useState({
companyID: '', company: '', careers_url: '',
work_model: WorkModel.FULLY_REMOTE, headquarters: '', fields: '',
});
const [trackCompany, setTrackCompany] = useState(true);
const [ranking, setRanking] = useState(75);
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setCompanyData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const formattedData: CreateCompanyInput = {
                ...companyData,
                fields: companyData.fields.split(',').map(field => field.trim()),
            };
            await onAddCompany(formattedData, trackCompany, ranking);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to add company');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if(isOpen) {
            setCompanyData({ companyID: '', company: '', careers_url: '', work_model: WorkModel.FULLY_REMOTE, headquarters: '', fields: '' });
            setTrackCompany(true);
            setRanking(75);
            setError('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4">
             <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 max-w-lg w-full my-auto shadow-2xl transition-all duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Add New Company</h2>
                    <button onClick={onClose} aria-label="Close modal" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={24} /></button>
                </div>
                {error && <div className="mb-4 p-3 bg-red-500/10 text-red-500/90 border border-red-500/30 rounded-lg text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <InputField label="Company ID*" name="companyID" value={companyData.companyID} onChange={handleChange} placeholder="e.g. acme_corp" required />
                        <InputField label="Company Name*" name="company" value={companyData.company} onChange={handleChange} placeholder="e.g. Acme Corporation" required />
                    </div>
                    <InputField label="Careers URL*" name="careers_url" type="url" value={companyData.careers_url} onChange={handleChange} placeholder="https://example.com/careers" required />
                     <div className="grid md:grid-cols-2 gap-4">
                        <SelectField label="Work Model*" name="work_model" value={companyData.work_model} onChange={handleChange} options={Object.values(WorkModel)} required />
                        <InputField label="Headquarters*" name="headquarters" value={companyData.headquarters} onChange={handleChange} placeholder="e.g. San Francisco, USA" required />
                    </div>
                    <InputField label="Fields/Industries*" name="fields" value={companyData.fields} onChange={handleChange} placeholder="e.g. AI, SaaS, Fintech" helpText="Comma-separated list." required />

                    <div className="border-t border-[var(--card-border)] pt-4 mt-4 space-y-4">
                        <CheckboxField label="Track this company" checked={trackCompany} onChange={() => setTrackCompany(!trackCompany)} />
                        {trackCompany && <RangeField label="Ranking" value={ranking} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRanking(parseInt(e.target.value))} />}
                    </div>
                    <div className="mt-6 flex items-center justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                          {isSubmitting ? 'Adding...' : 'Add Company'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

}

// From: src/utils/frontendLogger.ts
function createLogger(context: string) {
return { error: (message: string, error?: any) => console.error(`[${context}] ${message}`, error) };
}

// From: src/constants/styles.ts
const PAGE_BACKGROUND_GLOW = 'background-glows fixed inset-0 z-0';
const HEADING_LG = 'text-3xl font-bold text-[var(--text-primary)] mb-2';
const HEADING_MD = 'text-xl font-semibold text-[var(--text-primary)] mb-2';
const TEXT_SECONDARY = 'text-[var(--text-secondary)]';
const FLEX_BETWEEN = 'flex items-center justify-between';
const BUTTON_PRIMARY_PURPLE = 'bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors';
const CARD_CONTAINER = 'bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 shadow-lg';
const PAGE_CONTENT_CONTAINER = 'relative z-10 max-w-7xl mx-auto pt-20 md:pt-24 pb-24 px-4';

// --- MAIN PAGE COMPONENT ---
const CompanyCard = ({ company }: { company: ICompany }) => {
const logger = createLogger('CompanyCard');
const { trackCompany, untrackCompany, updateRanking } = useCompanies();
const [isEditingRanking, setIsEditingRanking] = useState(false);
const [ranking, setRanking] = useState(company.userPreference?.rank ?? 75);

const handleTrackingToggle = async () => {
if (company.userPreference?.isTracking) {
await untrackCompany(company.companyID);
} else {
await trackCompany({ companyId: company.companyID, rank: ranking });
}
};

const handleRankSave = async (newRank: number) => {
await updateRanking({ companyId: company.companyID, rank: newRank });
setIsEditingRanking(false);
};

return (
<>
<div className={`${CARD_CONTAINER} flex flex-col justify-between transition-all duration-300 hover:shadow-purple-500/10 hover:border-[var(--card-border-hover)] h-[130px]`}>
<div className="flex justify-between items-start">
<div className="flex-1">
<h3 className={`${HEADING_MD.replace('text-xl', 'text-lg').replace('mb-2', 'mb-1')}`}>{company.company}</h3>
<p className={`${TEXT_SECONDARY} text-xs mt-1 h-8 overflow-hidden`}>{company.fields.join(', ')}</p>
</div>
<label className="inline-flex items-center cursor-pointer ml-4">
<input type="checkbox" className="sr-only peer" checked={company.userPreference?.isTracking} onChange={handleTrackingToggle} />
<div className="relative w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer-focus:ring-2 peer-focus:ring-purple-500 peer-checked:bg-purple-600"><div className="absolute top-0.5 left-[2px] bg-white h-5 w-5 rounded-full transition-transform peer-checked:translate-x-5"></div></div>
</label>
</div>

        <div className="flex justify-end items-center mt-2">
            {company.userPreference?.isTracking && (
                 <button onClick={() => setIsEditingRanking(true)} className="text-xs flex items-center gap-1 text-purple-500 hover:text-purple-400">
                    Rank: {company.userPreference.rank}
                    <Pencil size={12} />
                 </button>
            )}
        </div>
      </div>
      {isEditingRanking && (
          <RankingModal
            isOpen={isEditingRanking}
            onClose={() => setIsEditingRanking(false)}
            onSave={handleRankSave}
            initialRank={ranking}
            companyName={company.company}
          />
      )}
    </>

);
};

// --- NEW RANKING MODAL ---
const RankingModal = ({ isOpen, onClose, onSave, initialRank, companyName }: {
isOpen: boolean;
onClose: () => void;
onSave: (rank: number) => void;
initialRank: number;
companyName: string;
}) => {
const [rank, setRank] = useState(initialRank);

    useEffect(() => {
        setRank(initialRank);
    }, [initialRank]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Rank {companyName}</h3>
                <RangeField label="Ranking" value={rank} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRank(parseInt(e.target.value))} />
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Cancel</button>
                    <button onClick={() => onSave(rank)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg">Save Rank</button>
                </div>
            </div>
        </div>
    );

};

const CompanyFilters = ({ onSearchChange, onWorkModelChange, onSortChange, onShowTrackedOnlyChange, currentFilters }: { onSearchChange: (v: string) => void; onWorkModelChange: (v: string) => void; onSortChange: (v: string) => void; onShowTrackedOnlyChange: (v: boolean) => void; currentFilters: { search: string; workModel: string; sort: string; showTrackedOnly: boolean; }; }) => {
const workModelOptions = [
{ value: 'all', label: 'All', Icon: LayoutGrid },
{ value: 'FULLY_REMOTE', label: 'Remote', Icon: Home },
{ value: 'HYBRID', label: 'Hybrid', Icon: Building2 },
{ value: 'IN_OFFICE', label: 'On-Site', Icon: Building },
];

    return (
    <div className={`${CARD_CONTAINER} mb-8`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
        <div><label htmlFor="search-input" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Search</label><input type="text" id="search-input" placeholder="Company name..." className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)]" value={currentFilters.search} onChange={e => onSearchChange(e.target.value)} /></div>
        <div className="flex flex-col justify-end min-h-[60px]"><label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Tracked Status</label><div className={`flex items-center p-2 rounded-lg transition-colors duration-300 ${currentFilters.showTrackedOnly ? 'bg-purple-500/10' : 'bg-transparent'}`}><label className="inline-flex items-center cursor-pointer w-full"><input type="checkbox" className="sr-only peer" checked={currentFilters.showTrackedOnly} onChange={e => onShowTrackedOnlyChange(e.target.checked)} /><div className="relative w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer-checked:bg-purple-600"><div className="absolute top-0.5 left-[2px] bg-white h-5 w-5 rounded-full transition-transform peer-checked:translate-x-5"></div></div><span className={`ml-3 text-sm font-medium ${currentFilters.showTrackedOnly ? 'text-purple-400' : 'text-slate-500'}`}>Tracked Only</span></label></div></div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Work Model</label>
          <div className="flex items-center justify-around bg-black/5 dark:bg-slate-800 p-1 rounded-lg">
            {workModelOptions.map(({ value, label, Icon }) => (
              <button key={value} title={label} onClick={() => onWorkModelChange(value)} className={`p-2 rounded-md transition-colors ${currentFilters.workModel === value ? 'bg-purple-600 text-white shadow' : 'text-[var(--text-secondary)] hover:bg-black/10 dark:hover:bg-slate-700'}`}>
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="sort-select" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Sort By</label>
          <select id="sort-select" className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)]" value={currentFilters.sort} onChange={e => onSortChange(e.target.value)}>
            <option value="name-asc">Name (A-Z)</option><option value="name-desc">Name (Z-A)</option><option value="ranking-desc">Ranking (High-Low)</option><option value="ranking-asc">Ranking (Low-High)</option>
          </select>
        </div>
      </div>
    </div>

)};

const InfoBanner = ({ onDismiss }: { onDismiss: () => void }) => (
<div className="bg-purple-100/80 dark:bg-purple-500/10 border border-purple-300/50 dark:border-purple-500/30 p-4 rounded-lg mb-8 flex items-start gap-4">
<Info size={20} className="text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
<div className="flex-grow">
<h4 className="font-semibold text-purple-800 dark:text-purple-300">How Ranking Works</h4>
<p className="text-sm text-purple-700/90 dark:text-purple-300/80">
Ranking affects check frequency. Higher-ranked companies are checked for new jobs more often.
</p>
</div>
<button onClick={onDismiss} className="text-purple-500/80 hover:text-purple-600 dark:text-purple-300/70 dark:hover:text-purple-200">
<X size={20} />
</button>
</div>
);

function CompaniesPage() {
const logger = useMemo(() => createLogger('CompaniesPage'), []);
const { companies: allCompanies, trackedCompanies, isLoading, isError, error, createCompany, trackCompany } = useCompanies();
const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
const [showInfoBanner, setShowInfoBanner] = useState(true);
const [filters, setFilters] = useState({ search: '', workModel: 'all', sort: 'name-asc', showTrackedOnly: true });
const [initialFilterSet, setInitialFilterSet] = useState(false);

useEffect(() => {
if (!isLoading && !initialFilterSet && trackedCompanies) {
setFilters(prev => ({ ...prev, showTrackedOnly: trackedCompanies.length > 0 }));
setInitialFilterSet(true);
}
}, [isLoading, trackedCompanies, initialFilterSet]);

const getCompanyRanking = (companyId: string): number => {
const tracked = trackedCompanies?.find(t => t.companyID === companyId);
return tracked?.userPreference?.rank ?? 0;
};

const combinedCompanies = useMemo(() => {
if (!allCompanies) return [];
return allCompanies.map(company => {
const trackedInfo = trackedCompanies?.find(t => t.companyID === company.companyID);
return { ...company, userPreference: trackedInfo ? { rank: getCompanyRanking(company.companyID), isTracking: true } : { rank: 75, isTracking: false } };
});
}, [allCompanies, trackedCompanies]);

const filteredCompanies = combinedCompanies
.filter(company => {
const searchMatch = company.company.toLowerCase().includes(filters.search.toLowerCase());
const workModelMatch = filters.workModel === 'all' || company.work_model === filters.workModel;
const trackedMatch = !filters.showTrackedOnly || (company.userPreference?.isTracking);
return searchMatch && workModelMatch && trackedMatch;
})
.sort((a, b) => {
switch (filters.sort) {
case 'name-asc': return a.company.localeCompare(b.company);
case 'name-desc': return b.company.localeCompare(a.company);
case 'ranking-desc': return (b.userPreference?.rank ?? 0) - (a.userPreference?.rank ?? 0);
case 'ranking-asc': return (a.userPreference?.rank ?? 0) - (b.userPreference?.rank ?? 0);
default: return 0;
}
});

return (
<div className="bg-[var(--page-bg)] text-[var(--text-primary)] min-h-screen">
<style>{`        :root {
            --page-bg: #f9fafb;
            --card-bg: #ffffff;
            --card-border: #e5e7eb;
            --card-border-hover: #d1d5db;
            --input-bg: #ffffff;
            --input-border: #d1d5db;
            --text-primary: #111827;
            --text-secondary: #6b7280;
        }
        .dark {
            --page-bg: #030712;
            --card-bg: #111827;
            --card-border: #1f2937;
            --card-border-hover: #374151;
            --input-bg: #1f2937;
            --input-border: #374151;
            --text-primary: #f9fafb;
            --text-secondary: #9ca3af;
        }
        .accent-purple-500 { accent-color: #a855f7; } 
        .background-glows {
          background-image: radial-gradient(circle at 10% 20%, rgba(168, 85, 247, 0.2), transparent 40%),
                            radial-gradient(circle at 80% 90%, rgba(236, 72, 153, 0.2), transparent 45%),
                            radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.15), transparent 40%);
        }
     `}</style>
<div className={PAGE_BACKGROUND_GLOW}></div>
<ThemeToggle />
<main className={PAGE_CONTENT_CONTAINER}>
<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
<div>
<h1 className={HEADING_LG}>Track Companies</h1>
<p className={TEXT_SECONDARY}>Select companies to monitor for new job openings.</p>
</div>
<button onClick={() => setIsAddCompanyModalOpen(true)} className={`${BUTTON_PRIMARY_PURPLE} px-4 py-2 flex items-center gap-2 self-start md:self-center`}>
<Plus size={16} />
Add Company
</button>
</div>
{showInfoBanner && <InfoBanner onDismiss={() => setShowInfoBanner(false)} />}
<CompanyFilters onSearchChange={search => setFilters(f => ({ ...f, search }))} onWorkModelChange={workModel => setFilters(f => ({ ...f, workModel }))} onSortChange={sort => setFilters(f => ({ ...f, sort }))} onShowTrackedOnlyChange={showTrackedOnly => setFilters(f => ({ ...f, showTrackedOnly }))} currentFilters={filters} />
{isLoading && <div className={`text-center py-10 ${TEXT_SECONDARY}`}>Loading companies...</div>}
{isError && <div className="text-center py-10 text-red-500"><p>Error: {error?.message}</p></div>}
{!isLoading && !isError && filteredCompanies.length === 0 && <div className={`text-center py-10 ${TEXT_SECONDARY}`}>No companies match your filters.</div>}
{!isLoading && !isError && (
<div id="company-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
{filteredCompanies.map(company => <CompanyCard key={company.companyID} company={company} />)}
</div>
)}
</main>
<AddCompanyModal isOpen={isAddCompanyModalOpen} onClose={() => setIsAddCompanyModalOpen(false)} onAddCompany={async (companyData, track, ranking) => {
try {
const result = await createCompany(companyData);
if (track && result.company) {
await trackCompany({ companyId: result.company.companyID, rank: ranking });
}
setIsAddCompanyModalOpen(false);
} catch (error) {
logger.error('Failed to create company', { error });
throw error;
}
}} />
</div>
);
}

export default function App() {
const [queryClient] = useState(() => new QueryClient());
return (
<ThemeProvider attribute="class" defaultTheme="light">
<QueryClientProvider client={queryClient}>
<CompaniesPage />
</QueryClientProvider>
</ThemeProvider>
);
}
