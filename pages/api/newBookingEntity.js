import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      console.log('API route: Starting fetch to external API');
      const response = await fetch("https://decisions-systemmicro.ca/Primary/restapi/Flow/01JBWH4MSBHJCJ65RAGM89VY9T", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", "guest": "true", "outputtype":"Json"
        },
        // Include the guest parameter in the request body
        body: JSON.stringify({ guest: true, outputtype:"Json", ...req.body }),
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
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}