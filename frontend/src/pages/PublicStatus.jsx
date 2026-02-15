import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import StatusBadge from '../components/StatusBadge';
import ResponseChart from '../components/ResponseChart';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function PublicStatus() {
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const serviceId = searchParams.get('service_id');

  useEffect(() => {
    const fetchPublicStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = serviceId
          ? `${API_URL.replace('/api', '')}/public/status?service_id=${serviceId}`
          : `${API_URL.replace('/api', '')}/public/status`;

        const response = await axios.get(url);

        if (serviceId) {
          setSelectedService(response.data.service);
          setServices([response.data.service]);
        } else {
          setSummary(response.data.summary);
          setServices(response.data.services);
        }
      } catch (err) {
        console.error('Failed to fetch public status:', err);
        setError('Failed to load service status. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicStatus();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPublicStatus, 30000);
    return () => clearInterval(interval);
  }, [serviceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-6 max-w-md text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">DragonPing Status</h1>
          <p className="text-gray-600 mt-2">Real-time service availability monitoring</p>
        </div>
      </div>

      {/* Summary */}
      {summary && !serviceId && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-900">{summary.total_services}</div>
              <div className="text-gray-600 text-sm mt-2">Total Services</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600">{summary.up_services}</div>
              <div className="text-gray-600 text-sm mt-2">Services Up</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-red-600">{summary.down_services}</div>
              <div className="text-gray-600 text-sm mt-2">Services Down</div>
            </div>
          </div>
        </div>
      )}

      {/* Services */}
      <div className="max-w-7xl mx-auto px-4 py-8 pb-16">
        {serviceId && selectedService ? (
          // Detailed view for single service
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <a
                href="/public"
                className="text-blue-500 hover:text-blue-700 text-sm mb-4 inline-block"
              >
                ← Back to All Services
              </a>

              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedService.name}</h2>
                  {selectedService.url && (
                    <p className="text-gray-600 text-sm mt-1 break-all">{selectedService.url}</p>
                  )}
                  {selectedService.ip_address && (
                    <p className="text-gray-600 text-sm mt-1">IP: {selectedService.ip_address}</p>
                  )}
                </div>
                <StatusBadge status={selectedService.status} size="lg" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded p-4">
                  <div className="text-sm text-gray-600">Type</div>
                  <div className="text-lg font-semibold text-gray-900 mt-1">
                    {selectedService.type === 'website' ? 'Web Service' : 'Device'}
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-4">
                  <div className="text-sm text-gray-600">Protocol</div>
                  <div className="text-lg font-semibold text-gray-900 mt-1 uppercase">
                    {selectedService.protocol}
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-4">
                  <div className="text-sm text-gray-600">Uptime</div>
                  <div className="text-lg font-semibold text-green-600 mt-1">
                    {selectedService.uptime_percentage.toFixed(2)}%
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-4">
                  <div className="text-sm text-gray-600">Avg Response</div>
                  <div className="text-lg font-semibold text-gray-900 mt-1">
                    {selectedService.avg_response_time ? `${selectedService.avg_response_time.toFixed(0)}ms` : 'N/A'}
                  </div>
                </div>
              </div>

              {selectedService.last_check && (
                <div className="text-sm text-gray-600">
                  Last checked: {new Date(selectedService.last_check).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        ) : (
          // List view for all services
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <a
                key={service.service_id}
                href={`/public?service_id=${service.service_id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {service.type === 'website' ? '🌐 Web Service' : '🖥️ Device'}
                    </p>
                  </div>
                  <StatusBadge status={service.status} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Uptime</span>
                    <span className="font-semibold text-gray-900">
                      {service.uptime_percentage.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Response</span>
                    <span className="font-semibold text-gray-900">
                      {service.avg_response_time ? `${service.avg_response_time.toFixed(0)}ms` : 'N/A'}
                    </span>
                  </div>

                  {service.last_check && (
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                      Updated {new Date(service.last_check).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {services.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Available</h3>
            <p className="text-gray-600">
              There are no public services available to display at this time.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>DragonPing Uptime Monitoring System</p>
        <p className="mt-2">Status updates every 30 seconds</p>
      </div>
    </div>
  );
}
