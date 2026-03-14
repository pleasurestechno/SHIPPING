import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // Adjust path as necessary

function ShippingDashboard() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchShipments() {
    try {
      setLoading(true);
      setError(null);
      
      let {
        data,
        error: queryError
      } = await supabase
        .from('shipping_data')
        .select('*')
        .order('eta_los_angeles', { ascending: true }); // Order by ETA

      if (queryError) throw queryError;

      // Handle potential nulls or unexpected data types for dates
      const processedData = (data || []).map(item => ({
        ...item,
        eta_los_angeles: item.eta_los_angeles ? new Date(item.eta_los_angeles).toISOString() : null,
        last_event_date: item.last_event_date ? new Date(item.last_event_date).toISOString() : null,
        last_checked: item.last_checked ? new Date(item.last_checked).toISOString() : null,
      }));

      setShipments(processedData);
    } catch (error) {
      setError('Failed to load shipments. ' + error.message);
      console.error('Error fetching shipments:', error);
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
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if not a valid date
      }
      // Use toLocaleDateString for better formatting, falling back to ISO string
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      console.error('Date formatting error for:', dateString, e);
      return dateString; // Return original string if parsing fails
    }
  };
  
  // Helper to determine row class for visual cues
  const getStatusClass = (etaString) => {
    if (!etaString) return 'bg-white';
    try {
      const eta = new Date(etaString);
      const now = new Date();
      const timeDiff = eta.getTime() - now.getTime();
      const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysUntil < 0) return 'bg-red-100 hover:bg-red-200'; // Past ETA
      if (daysUntil <= 3) return 'bg-yellow-100 hover:bg-yellow-200'; // Approaching ETA
      return 'bg-green-100 hover:bg-green-200'; // Within a week or more
    } catch (e) {
      console.error('Status class error for:', etaString, e);
      return 'bg-gray-100 hover:bg-gray-200'; // Fallback
    }
  };

  const paidStatus = (status) => (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status === 'Y' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {status === 'Y' ? 'Yes' : 'No'}
    </span>
  );

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6 font-sans'>
      <h1 className='text-4xl font-extrabold mb-8 text-primary text-center tracking-tight'>Shipment Tracker</h1>

      {loading && <p className='text-center text-primary text-lg'>Loading shipments...</p>}
      {error && <p className='text-center text-red-500 text-lg'>{error}</p>}

      {!loading && !error && shipments.length === 0 && (
        <p className='text-center text-gray-500 text-lg'>No shipment data available.</p>
      )}

      {!loading && !error && shipments.length > 0 && (
        <div className='overflow-hidden shadow-xl rounded-2xl border border-gray-200'>
          <table className='min-w-full table-auto'>
            <thead className='bg-primary-hover text-white'>
              <tr>
                <th scope='col' className='px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider'>ETA</th>
                <th scope='col' className='px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider'>Company</th>
                <th scope='col' className='px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider'>Container #</th>
                <th scope='col' className='px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider'>Status</th>
                <th scope='col' className='px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider'>Port</th>
                <th scope='col' className='px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider'>Vessel</th>
                <th scope='col' className='px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider'>Last Event</th>
                <th scope='col' className='px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider'>Paid Vendor</th>
                <th scope='col' className='px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider'>Paid Cargo</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {shipments.map((shipment) => (
                <tr key={shipment.container_id || shipment.id} className={`${getStatusClass(shipment.eta_los_angeles)} hover:shadow-lg transition-all duration-300 ease-in-out`}>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>{formatDate(shipment.eta_los_angeles)}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>{shipment.shipping_company || 'N/A'}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>{shipment.container_id || 'N/A'}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${shipment.status === 'Loaded (FCL) on Vessel' ? 'bg-blue-100 text-blue-800' : shipment.status === 'Gate In to Outbound Terminal' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                      {shipment.status || 'N/A'}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>{shipment.port_of_discharge || 'N/A'}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>{shipment.vessel || 'N/A'}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{formatDate(shipment.last_event_date)}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-center'>{paidStatus(shipment.paid_vendor)}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-center'>{paidStatus(shipment.paid_cargo)}</td>
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
