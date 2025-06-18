#!/bin/sh

# Check the status of jobs in the database
echo "CHECKING JOB QUEUE STATUS..."

# Get counts
echo "\n--- JOB COUNTS ---"
echo "Total jobs:"
mongosh --quiet --eval "db.jobqueues.countDocuments()" scoutly
echo "Pending jobs:"
mongosh --quiet --eval "db.jobqueues.countDocuments({status: 'pending'})" scoutly
echo "Processing jobs:"
mongosh --quiet --eval "db.jobqueues.countDocuments({status: 'processing'})" scoutly
echo "Completed jobs:"
mongosh --quiet --eval "db.jobqueues.countDocuments({status: 'completed'})" scoutly
echo "Failed jobs:"
mongosh --quiet --eval "db.jobqueues.countDocuments({status: 'failed'})" scoutly

# Get example jobs
echo "\n--- SAMPLE JOBS ---"
mongosh --quiet --eval "db.jobqueues.find().limit(5).toArray().forEach(j => print(j.status + ': ' + j.companyId))" scoutly

echo "\nDONE!"
