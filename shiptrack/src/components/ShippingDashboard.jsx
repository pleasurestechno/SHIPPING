import React, { useEffect, useState } from 'react';

// Import the Supabase client from the dedicated file
import { supabase } from '../supabaseClient'; 

function ShippingDashboard() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchShipments() {
    try {
      setLoading(true);
      setError(null);

      console.log('Attempting to fetch data from Supabase...');

      // Fetch data from Supabase
      let { data, error: queryError } = await supabase
        .from('shipping_data')
        .select('*')
        .order('eta_los_angeles', { ascending: true }); // Order by ETA

      if (queryError) {
        console.error('Supabase query error:', queryError);
        // For specific error handling, you might check queryError.code
        throw new Error(`Supabase Error: ${queryError.message}`);
      }
      
      console.log('Supabase fetch successful. Data:', data);

      // Process data for consistent date handling, ensuring they are valid ISO strings or null
      const processedData = (data || []).map(item => ({
        ...item,
        eta_los_angeles: item.eta_los_angeles ? new Date(item.eta_los_angeles).toISOString() : null,
        last_event_date: item.last_event_date ? new Date(item.last_event_date).toISOString() : null,
        last_checked: item.last_checked ? new Date(item.last_checked).toISOString() : null,
      }));

      setShipments(processedData);

    } catch (fetchError) {
      console.error('Error in fetchShipments:', fetchError);
      setError('Failed to load shipments: ' + fetchError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchShipments();
  }, []);

  // Helper to format dates nicely
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if not a valid date
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      console.error('Date formatting error for:', dateString, e);
      return dateString;
    }
  };

  // Helper to determine row status class based on ETA
  const getStatusClass = (etaString) => {
    if (!etaString) return 'bg-white'; // Default background for no ETA
    try {
      const eta = new Date(etaString);
      const now = new Date();
      const timeDiff = eta.getTime() - now.getTime();
      const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysUntil < 0) return 'bg-red-100 hover:bg-red-200'; // Past ETA
      if (daysUntil <= 3) return 'bg-yellow-100 hover:bg-yellow-200'; // Approaching ETA (within 3 days)
      return 'bg-green-100 hover:bg-green-200 border-l-2 border-green-300'; // Further out ETA
    } catch (e) {
      console.error('Status class error for ETA:', etaString, e);
      return 'bg-gray-100 hover:bg-gray-200'; // Fallback style
    }
  };

  // Helper for Paid status badges
  const renderPaidStatus = (status) => (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status === 'Y' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {status === 'Y' ? 'Yes' : 'No'}
    </span>
  );

  // Helper function to get classes for status badges
  const getBadgeClasses = (status) => {
    switch (status) {
      case 'Loaded (FCL) on Vessel':
        // Use a color that stands out better against the new background
        return 'bg-blue-200 text-blue-900';
      case 'Gate In to Outbound Terminal':
        // Use a more distinct purple
        return 'bg-purple-200 text-purple-900';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 p-6 font-sans antialiased'>
      <h1 className='text-4xl font-extrabold mb-8 text-white text-center tracking-tight shadow-lg pb-2'>Shipment Tracker</h1>

      {loading && <p className='text-center text-blue-100 text-lg'>Loading shipments...</p>}
      {error && <p className='text-center text-red-300 text-lg'>{error}</p>}

      {!loading && !error && shipments.length === 0 && (
        <p className='text-center text-gray-300 text-lg'>No shipment data available.</p>
      )}

      {!loading && !error && shipments.length > 0 && (
        <div className='overflow-hidden shadow-xl rounded-2xl border border-gray-700 bg-white/40 backdrop-blur-md max-w-7xl mx-auto'> {/* Increased max-width slightly for very wide screens */}
          <table className='min-w-full table-auto border-separate border-spacing-y-1'>
            <thead className='bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10'>
              <tr>
                <th scope='col' className='px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-lg'>ETA</th>
                <th scope='col' className='px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider'>Company</th>
                <th scope='col' className='px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider'>Container #</th>
                <th scope='col' className='px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider'>Status</th>
                <th scope='col' className='px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider'>Port</th>
                <th scope='col' className='px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider'>Vessel</th>
                <th scope='col' className='px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider'>Last Event</th>
                <th scope='col' className='px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider'>Paid Vendor</th>
                <th scope='col' className='px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider rounded-tr-lg'>Paid Cargo</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-300'>
              {shipments.map((shipment) => (
                <tr
                  key={shipment.container_id || shipment.id}
                  className={`${getStatusClass(shipment.eta_los_angeles)} hover:shadow-xl transition-all duration-300 ease-in-out`}
                >
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>{formatDate(shipment.eta_los_angeles)}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>{shipment.shipping_company || 'N/A'}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>{shipment.container_id || 'N/A'}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeClasses(shipment.status)}`}>
                      {shipment.status || 'N/A'}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>{shipment.port_of_discharge || 'N/A'}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>{shipment.vessel || 'N/A'}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{formatDate(shipment.last_event_date)}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-center'>{renderPaidStatus(shipment.paid_vendor)}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-center'>{renderPaidStatus(shipment.paid_cargo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ShippingDashboard;
