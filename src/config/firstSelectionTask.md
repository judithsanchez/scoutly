<TaskDefinition>
    <Objective>
        Your task is to visit, analyze, and perform a high-level preliminary screening of a provided list of URLs to identify potential job opportunities for the candidate. The objective is to quickly filter out irrelevant links and create a shortlist of plausible job postings for deeper analysis.
    </Objective>

    <Context>
        The provided list contains URLs found by an automated web scraper. This list will likely contain a mix of valid job postings and irrelevant pages (e.g., 'About Us,' blog posts, main career portals). Your first challenge is to access the content of these URLs and then separate the signal from the noise. This is a generic, first-pass filter; you are looking for general role alignment (like "Software Engineer") rather than a deep, nuanced match at this stage.
    </Context>

    <Instructions>
        You will be given a list of URLs. Follow these steps for each one:

        1.  **Access and Analyze URL:** You must access the content of the provided URL. If a URL is inaccessible, broken, blocked, or leads to an error page, you will immediately classify it for discard and move to the next.

        2.  **Identify Job Postings:** Analyze the fetched content to determine if it represents a specific, individual job posting. Look for keywords like "Apply," "Job Description," "Responsibilities," a clear job title, and location information. Discard any items that are clearly not job postings.

        3.  **Perform High-Level Match ("First Glance"):** For the pages you identify as actual job postings, perform a quick, "at-a-glance" assessment against the candidate's core profile (e.g., "Software Engineer," "Frontend Developer").

        4.  **Eliminate Obvious Mismatches:** Your primary goal here is elimination. Immediately discard postings that are clear non-fits based on your Core Persona's rules, such as:
            * **Role Mismatch:** The role is fundamentally different (e.g., "Product Manager" for a "Software Engineer" candidate).
            * **Seniority Mismatch:** The role is drastically outside the candidate's reach (e.g., "Director of Engineering," "Principal Architect").
            * **Domain Mismatch:** The role is in a completely unrelated technical field (e.g., "Embedded Systems Engineer" for a "Web Developer").

        5.  **Shortlist Potential Fits:** If a posting appears to be for a relevant role and does not have an immediate red flag, it should be considered a potential match. Your final decisions (e.g., "Potential Match" or "Discarded") should be ready for the structured output you will generate.
    </Instructions>

    <InputDataFormat>
        The input will be a simple JSON array of URL strings.

        ```json
        [
          "[https://company.com/careers/job123](https://company.com/careers/job123)",
          "[https://company.com/about-us](https://company.com/about-us)",
          "[https://company.com/careers/job456-principal-scientist](https://company.com/careers/job456-principal-scientist)",
          "[https://broken-link.com/404-error](https://broken-link.com/404-error)"
        ]
        ```
    </InputDataFormat>

</TaskDefinition>
