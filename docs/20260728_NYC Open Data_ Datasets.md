**NYC Open Data: Datasets**

**What is [NYC Open Data](https://opendata.cityofnewyork.us/data/)?**

NYC Open Data is the City of New York's public data portal, hosting thousands of datasets published by city agencies: everything from housing violations to restaurant inspections to traffic counts. Any of it is free to access, and most of it updates on a real schedule, some daily, some annually, rather than sitting frozen as a one-time snapshot.

**But..why?**

Every product you build should be grounded in something real. NYC Open Data gives you access to the actual, current record of what's happening in the city: real violations, real inspections, real complaints.

That also means the data can be messier and larger than a typical practice dataset. Learning to filter and query it responsibly isn't optional. It's the skill that makes everything else you do with this data actually usable.

**How to access your dataset via API endpoints**

You can access a dataset's API directly with no account at all, or you can use a free App Token. We recommend using an App Token for the reasons below, but feel free to explore both and see the difference yourself. One token works across every NYC Open Data dataset you'll ever use, so you only need to set this up once, not separately for each dataset.

**App Tokens: The What and The Why**

An App Token is a free identifier that attaches your requests to your own account instead of leaving them anonymous. NYC Open Data technically allows requests without one, but unauthenticated requests share a much smaller, stricter rate limit with everyone else making requests from the same network. If you're in a room full of people all querying the same dataset at once, that shared limit runs out fast, and the errors that follow look like a bug in your code when they're really just a traffic jam.

With a free App Token, your requests are attributed to you specifically. You get your own pool of requests instead of splitting one with the room. It takes under a minute to set up and removes a whole category of confusing, hard-to-diagnose errors before they happen.

**How to request an app token:** 

**1\.** Go to data.cityofnewyork.us and create a free account, or sign in if you already have one.

**2\.** Click on your account or profile settings and look for Developer Settings.

**3\.** Click Create New App Token. Give it any name you'll recognize, such as your first name plus "Pursuit L1 Cycle 3."

**4\.** Save your App Token somewhere secure. Treat it like a password: never commit it to a public GitHub repo, and never share it in Slack or a screenshot. 

**5\.** Request data from your API endpoint using your app token and the API endpoint (see below). 

**How to get the API endpoint for your dataset:** 

**1\.** Go to your specific dataset's page (linked below), click the Actions button in the top right, and select API. 

**2\.** Select API Endpoint, data format (JSON or CSV; you pick), and then copy the API endpoint at the bottom of the popup, noting the extra authentication setup if you select the SODA3 version. 

**3\.**  Learn more about your specific dataset’s API and fields by clicking on API Documentation in the popup window. 

| A note on API limits, and how to get around them: Every query defaults to returning only 1,000 rows at a time, even with an App Token. To get more, use the $limit parameter to raise how many rows come back in one request, or the $offset parameter to page through the dataset in chunks, 1,000 rows at a time. You can combine both to page through in whatever size chunk you choose. Read more: [How to query more than 1000 rows of a dataset](https://support.socrata.com/hc/en-us/articles/202949268-How-to-query-more-than-1000-rows-of-a-dataset). |
| :---- |

**The Six Datasets** 

| HOUSING & DEVELOPMENT Open HPD Violations |
| :---- |
| Housing Preservation and Development violations that are currently open, tracked since 2012\. One row is one active violation at a specific address. **Link:** [https://data.cityofnewyork.us/Housing-Development/Open-HPD-Violations/csn4-vhvf](https://data.cityofnewyork.us/Housing-Development/Open-HPD-Violations/csn4-vhvf) *On this page, click Actions, then select API to get this dataset's endpoint.* |

| PUBLIC SAFETY Motor Vehicle Collisions – Crashes |
| :---- |
| Every reported motor vehicle collision in NYC since 2012, including location, contributing factors, and injuries. One row is one crash. Note: This is a large dataset, over 2 million rows, so filter before you fetch. **Link:** [https://data.cityofnewyork.us/Public-Safety/Motor-Vehicle-Collisions-Crashes/h9gi-nx95](https://data.cityofnewyork.us/Public-Safety/Motor-Vehicle-Collisions-Crashes/h9gi-nx95) *On this page, click Actions, then select API to get this dataset's endpoint.* |

| HEALTH DOHMH Restaurant Inspection Results |
| :---- |
| Every NYC restaurant inspection result, including violations and letter grades. One row is one inspection record for one restaurant. **Link:** [https://data.cityofnewyork.us/Health/DOHMH-New-York-City-Restaurant-Inspection-Results/43nn-pn8j](https://data.cityofnewyork.us/Health/DOHMH-New-York-City-Restaurant-Inspection-Results/43nn-pn8j) *On this page, click Actions, then select API to get this dataset's endpoint.* |

| EDUCATION School Quality Reports Data |
| :---- |
| Annual quality report metrics for NYC public schools. One row is one school's results for a given metric and year. **Link:** [https://data.cityofnewyork.us/Education/School-Quality-Reports-Data/dnpx-dfnc](https://data.cityofnewyork.us/Education/School-Quality-Reports-Data/dnpx-dfnc) *On this page, click Actions, then select API to get this dataset's endpoint.* |

| SOCIAL SERVICES 311 Service Requests from 2010 to Present |
| :---- |
| Every 311 complaint filed since 2010, across every complaint type and agency. One row is one service request. Note: This is the largest dataset in this cycle, over 24 million rows, so filter before you fetch. **Link:** [https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9](https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9) *On this page, click Actions, then select API to get this dataset's endpoint.* |

| TRANSPORTATION Automated Traffic Volume Counts |
| :---- |
| Traffic volume counts collected by automated recorders at roadways and bridge crossings across the city. One row is one location's count for a given date and hour. **Link:** [https://data.cityofnewyork.us/Transportation/Automated-Traffic-Volume-Counts/7ym2-wayt](https://data.cityofnewyork.us/Transportation/Automated-Traffic-Volume-Counts/7ym2-wayt) *On this page, click Actions, then select API to get this dataset's endpoint.* |

