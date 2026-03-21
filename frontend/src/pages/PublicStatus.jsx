import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import axios from 'axios';
import StatusBadge from '../components/StatusBadge';
import ResponseChart from '../components/ResponseChart';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function PublicStatus() {
  const [searchParams] = useSearchParams();
  const { username } = useParams();
  const [services, setServices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
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
          ? `${API_URL}/public/status/${username}?service_id=${serviceId}`
          : `${API_URL}/public/status/${username}`;

        const response = await axios.get(url);

        if (serviceId) {
          setSelectedService(response.data.service);
          setServices([response.data.service]);
        } else {
          setSummary(response.data.summary);
          setServices(response.data.services);
          setUserProfile(response.data.user);
        }
      } catch (err) {
        console.error('Failed to fetch public status:', err);
        if (err.response?.status === 404) {
             setError('User or service not found.');
        } else {
             setError('Failed to load service status. Please try again.');
        }
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
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#3498db]"></div>
          <p className="mt-4 text-dark-muted">Loading status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="bg-dark-card border border-dark-border rounded-lg shadow-sm p-6 max-w-md text-center">
          <div className="text-[#e74c3c] text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-dark-text mb-2">Error</h2>
          <p className="text-dark-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col font-sans">
      {/* Header */}
      <div className="bg-dark-card border-b border-dark-border">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold text-dark-text">
            {userProfile?.username ? `${userProfile.username}'s Status Page` : 'DragonPing Status'}
          </h1>
          <p className="text-dark-muted mt-2">Real-time service availability</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        
        {/* Overall Status Banner */}
        {!serviceId && summary && (
          <div className={`rounded-md p-4 mb-8 text-white shadow-sm flex items-center justify-center gap-2 ${
            summary.down_services === 0 ? 'bg-[#50b83c]' : 'bg-[#e74c3c]'
          }`}>
            {summary.down_services === 0 ? (
               <>
                 <span className="text-2xl">✓</span>
                 <span className="font-semibold text-lg">All Systems Operational</span>
               </>
            ) : (
               <>
                 <span className="text-2xl">✕</span>
                 <span className="font-semibold text-lg">Some systems are experiencing issues</span>
               </>
            )}
          </div>
        )}

        {serviceId && selectedService ? (
          // Detailed view for single service
          <div className="bg-dark-card rounded-md shadow-sm border border-dark-border overflow-hidden">
            <div className="p-6">
              <a
                href={`/public/${username}`}
                className="text-[#3498db] hover:underline text-sm mb-6 inline-block font-medium"
              >
                ← Back to All Services
              </a>

              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-dark-text">{selectedService.name}</h2>
                  {selectedService.url && (
                    <p className="text-dark-muted text-sm mt-1 break-all">{selectedService.url}</p>
                  )}
                  {selectedService.ip_address && (
                    <p className="text-dark-muted text-sm mt-1">IP: {selectedService.ip_address}</p>
                  )}
                </div>
                <StatusBadge status={selectedService.status} size="lg" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-dark-bg border border-dark-border rounded p-4">
                  <div className="text-sm text-dark-muted">Type</div>
                  <div className="text-lg font-semibold text-dark-text mt-1">
                    {selectedService.type === 'website' ? 'Web Service' : 'Device'}
                  </div>
                </div>

                <div className="bg-dark-bg border border-dark-border rounded p-4">
                  <div className="text-sm text-dark-muted">Protocol</div>
                  <div className="text-lg font-semibold text-dark-text mt-1 uppercase">
                    {selectedService.protocol}
                  </div>
                </div>

                <div className="bg-dark-bg border border-dark-border rounded p-4">
                  <div className="text-sm text-dark-muted">Uptime</div>
                  <div className="text-lg font-semibold text-[#50b83c] mt-1">
                    {selectedService.uptime_percentage.toFixed(2)}%
                  </div>
                </div>

                <div className="bg-dark-bg border border-dark-border rounded p-4">
                  <div className="text-sm text-dark-muted">Avg Response</div>
                  <div className="text-lg font-semibold text-dark-text mt-1">
                    {selectedService.avg_response_time ? `${selectedService.avg_response_time.toFixed(0)}ms` : 'N/A'}
                  </div>
                </div>
              </div>

              {selectedService.last_check && (
                <div className="text-sm text-dark-muted">
                  Last checked: {new Date(selectedService.last_check).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        ) : (
          // List view for all services - Uptime Kuma single column style
          <div className="bg-dark-card border border-dark-border rounded-md shadow-sm overflow-hidden mb-8">
            <div className="bg-dark-bg border-b border-dark-border px-6 py-3 font-semibold text-dark-text">
              Services
            </div>
            <div className="divide-y divide-dark-border">
              {services.map((service) => (
                <a
                  key={service.service_id}
                  href={`/public/${username}?service_id=${service.service_id}`}
                  className="px-6 py-4 flex items-center justify-between hover:bg-dark-bg transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                     <span className={`w-3 h-3 rounded-full ${service.status === 'UP' ? 'bg-[#50b83c]' : service.status === 'DOWN' ? 'bg-[#e74c3c]' : 'bg-gray-400'}`}></span>
                     <span className="font-medium text-dark-text group-hover:text-[#3498db] transition-colors">{service.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="hidden sm:block text-right">
                      <div className="text-xs text-dark-muted uppercase tracking-wide">Uptime</div>
                      <div className="text-sm font-semibold text-dark-text">{service.uptime_percentage.toFixed(2)}%</div>
                    </div>
                    
                    <div className="w-24 text-center">
                       {service.status === 'UP' ? (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-[#50b83c] bg-[#50b83c]/10 border border-[#50b83c]/20">
                            Up
                          </span>
                       ) : service.status === 'DOWN' ? (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-[#e74c3c] bg-[#e74c3c]/10 border border-[#e74c3c]/20">
                            Down
                          </span>
                       ) : (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-dark-muted bg-dark-bg border border-dark-border">
                            Unknown
                          </span>
                       )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {services.length === 0 && (
          <div className="bg-dark-card border border-dark-border rounded-lg shadow-sm p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-dark-text mb-2">No Services Available</h3>
            <p className="text-dark-muted">
              There are no public services available to display at this time.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto py-8 text-center text-sm text-dark-muted border-t border-dark-border mt-12 bg-dark-card">
        <p>Powered by <a href="/" className="text-[#3498db] hover:text-[#2980b9] transition-colors font-medium">DragonPing</a></p>
      </div>
    </div>
  );
}
