1.  Under no circumstance we make db calls on route.ts files. We use services and from there we do db operations, we also do not user models files to perform the db operations. The ONLY way api interact with db is using a service, no exceptions
2.  Always check if there is a service already handling similar db operation before creating a new one
3.  We always try to use ZOD if possible for validation
4.  If we need to user an env variable we add it to the constant files in which we access them, we try to never just hardcode env variables on the code
5.  Due to the complexity of our deployment setup on the routes we always need to make environments checks, check for examples
6.  We try to keep updated apiEndpoint.ts every time we are working on apis and routes
7.  We try to keep the zod schemas on the file of the request unless it is a schema that will be reused on other places of the application
8.  Always remove unused imports
9.  If you encounter a file with comments that are not really useful, remove them
