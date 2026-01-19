import { Router } from 'express';

const router = Router();

/**
 * GET /api/whois/:domain
 * Get domain age and WHOIS information
 */
router.get('/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    
    console.log('[WHOIS] Looking up domain:', domain);
    
    // Try WHOIS XML API (free tier)
    try {
      const response = await fetch(
        `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=at_free&domainName=${domain}&outputFormat=json`
      );
      const data = await response.json();
      
      if (data.WhoisRecord && data.WhoisRecord.createdDate) {
        const createdDate = new Date(data.WhoisRecord.createdDate);
        const now = new Date();
        const diffMs = now.getTime() - createdDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffYears = Math.floor(diffDays / 365);
        const diffMonths = Math.floor((diffDays % 365) / 30);
        
        let age, unit;
        if (diffYears > 0) {
          age = diffYears;
          unit = diffYears === 1 ? 'year' : 'years';
        } else if (diffMonths > 0) {
          age = diffMonths;
          unit = diffMonths === 1 ? 'month' : 'months';
        } else {
          age = diffDays;
          unit = diffDays === 1 ? 'day' : 'days';
        }
        
        return res.json({
          success: true,
          age,
          unit,
          raw: diffDays,
          registered: createdDate.toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.log('[WHOIS] Primary API failed:', error);
    }
    
    // Fallback: Try RDAP (Registration Data Access Protocol)
    try {
      const rdapResponse = await fetch(`https://rdap.org/domain/${domain}`);
      const rdapData = await rdapResponse.json();
      
      if (rdapData.events) {
        const registrationEvent = rdapData.events.find((e: any) => e.eventAction === 'registration');
        if (registrationEvent && registrationEvent.eventDate) {
          const createdDate = new Date(registrationEvent.eventDate);
          const now = new Date();
          const diffMs = now.getTime() - createdDate.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffYears = Math.floor(diffDays / 365);
          const diffMonths = Math.floor((diffDays % 365) / 30);
          
          let age, unit;
          if (diffYears > 0) {
            age = diffYears;
            unit = diffYears === 1 ? 'year' : 'years';
          } else if (diffMonths > 0) {
            age = diffMonths;
            unit = diffMonths === 1 ? 'month' : 'months';
          } else {
            age = diffDays;
            unit = diffDays === 1 ? 'day' : 'days';
          }
          
          return res.json({
            success: true,
            age,
            unit,
            raw: diffDays,
            registered: createdDate.toISOString().split('T')[0]
          });
        }
      }
    } catch (error) {
      console.log('[WHOIS] RDAP fallback failed:', error);
    }
    
    // If all APIs fail, return null
    res.json({
      success: false,
      message: 'Unable to determine domain age'
    });
    
  } catch (error) {
    console.error('[WHOIS] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lookup domain age'
    });
  }
});

export default router;
