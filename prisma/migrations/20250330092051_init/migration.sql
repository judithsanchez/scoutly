-- CreateEnum
CREATE TYPE "JobSourceType" AS ENUM ('COMPANY_WEBSITE', 'JOB_BOARD');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'IN_OFFICE', 'HYBRID');

-- CreateEnum
CREATE TYPE "WorkRegion" AS ENUM ('EMEA', 'APAC', 'NAM', 'LATAM', 'GLOBAL', 'EU', 'UK', 'ME', 'OCEANIA', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TechSkill" AS ENUM ('JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'CSHARP', 'GOLANG', 'RUST', 'RUBY', 'PHP', 'SWIFT', 'KOTLIN', 'CPP', 'C', 'SCALA', 'REACT', 'ANGULAR', 'VUE', 'SVELTE', 'HTML', 'CSS', 'SASS', 'NODE_JS', 'EXPRESS', 'DJANGO', 'FLASK', 'SPRING', 'LARAVEL', 'RAILS', 'SQL', 'POSTGRESQL', 'MYSQL', 'MONGODB', 'REDIS', 'ELASTICSEARCH', 'DOCKER', 'KUBERNETES', 'AWS', 'AZURE', 'GCP', 'TERRAFORM', 'JENKINS', 'GITHUB_ACTIONS', 'REACT_NATIVE', 'FLUTTER', 'IOS', 'ANDROID', 'GRAPHQL', 'REST', 'WEBSOCKETS', 'MACHINE_LEARNING', 'DATA_SCIENCE', 'BLOCKCHAIN', 'GAME_DEVELOPMENT');

-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('TECHNOLOGY', 'FINANCE', 'HEALTHCARE', 'EDUCATION', 'ECOMMERCE', 'MEDIA', 'GAMING', 'TRAVEL', 'TRANSPORTATION', 'ENERGY', 'MANUFACTURING', 'CONSULTING', 'NONPROFIT', 'GOVERNMENT', 'RETAIL', 'REAL_ESTATE', 'TELECOMMUNICATIONS');

-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE');

-- CreateTable
CREATE TABLE "Company" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "headquarters" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRemoteFirst" BOOLEAN NOT NULL,
    "companiSize" "CompanySize",
    "industry" "Industry"[],

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "workMode" "WorkMode",
    "timezone" "WorkRegion",
    "location" TEXT,
    "aiScore" INTEGER,
    "tags" TEXT[],
    "datePosted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentToTelegram" BOOLEAN NOT NULL DEFAULT false,
    "companyId" UUID NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_url_key" ON "JobPosting"("url");

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
