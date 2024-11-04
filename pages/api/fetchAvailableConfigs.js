import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      console.log('API route: Starting fetch to external API for all desk configs');
      console.log("hi");
      // Extract RoomID from query parameters
      const { FloorPlanID } = req.query;
      console.log("hi");

      // Construct the URL with RoomID as a query parameter
      const url = new URL("https://decisions-systemmicro.ca/Primary/restapi/Flow/01JBW38Y99XRPR79KQQPYA53AC");
      url.searchParams.append('guest', 'true');
      url.searchParams.append('outputtype', 'Json');
      if (FloorPlanID) {
        url.searchParams.append('FloorPlanID', FloorPlanID); 
      }

      const response = await fetch(url, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json", 
        },
        // Removed body as GET requests cannot have a body
      });

      console.log('API route: Response status:', response.status);
      console.log('API route: Response headers:', response.headers.raw());

      const responseText = await response.text();
      console.log('API route: Response text:', responseText);

      if (!response.ok) {
        throw new Error(`External API responded with status: ${response.status}, body: ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('API route: Failed to parse JSON:', parseError);
        throw new Error(`Failed to parse JSON response: ${responseText}`);
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Error in API route:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch data from the API' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}