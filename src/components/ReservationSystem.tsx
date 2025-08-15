
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, MapPin, User, Stethoscope, CreditCard, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  location: string;
}

interface Personnel {
  id: string;
  name: string;
  role: string;
  description: string;
  expert: boolean;
  location_id: string;
  service_ids: string[];
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  time: number;
}

interface Reservation {
  id: string;
  date: string;
  time: string;
  therapist_link: string;
}

interface FormData {
  statements: string[];
  location: Location | null;
  date: string;
  time: string;
  therapist: Personnel | null;
  service: Service | null;
  personalData: {
    fullName: string;
  };
}

const STATEMENTS = [
  "Szív problémám vagy pacemakerem van",
  "Nem rég műtöttek vagy csonkolásos műtéten estem át", 
  "Nyílt vagy fekélyes sebem van",
  "Sztómával rendelkezem",
  "Kiskorú gyerek kezelését igénylem",
  "A fentiek közül egyik sem érvényes rám nézve"
];

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00"
];

const STEPS = [
  { id: 1, title: "Nyilatkozat", icon: CheckCircle },
  { id: 2, title: "Helyszín", icon: MapPin },
  { id: 3, title: "Dátum", icon: Calendar },
  { id: 4, title: "Időpont", icon: Clock },
  { id: 5, title: "Terapeuta", icon: User },
  { id: 6, title: "Szolgáltatás", icon: Stethoscope },
  { id: 7, title: "Adatok", icon: CreditCard },
  { id: 8, title: "Összegzés", icon: CheckCircle }
];

export default function ReservationSystem() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    statements: [],
    location: null,
    date: '',
    time: '',
    therapist: null,
    service: null,
    personalData: { fullName: '' }
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    loadLocations();
    loadPersonnel();
    loadServices();
  }, []);

  // Load reservations when date changes
  useEffect(() => {
    if (formData.date) {
      loadReservations();
    }
  }, [formData.date]);

  // Calculate available time slots
  useEffect(() => {
    if (formData.location && formData.date) {
      calculateAvailableTimeSlots();
    }
  }, [formData.location, formData.date, personnel, reservations]);

  const loadLocations = async () => {
    const { data, error } = await supabase
      .from('nyirok_locations')
      .select('*');
    
    if (data && !error) {
      setLocations(data);
    }
  };

  const loadPersonnel = async () => {
    const { data, error } = await supabase
      .from('nyirok_personnel')
      .select('*');
    
    if (data && !error) {
      setPersonnel(data);
    }
  };

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('nyirok_services')
      .select('*');
    
    if (data && !error) {
      setServices(data);
    }
  };

  const loadReservations = async () => {
    const { data, error } = await supabase
      .from('nyirok_reservations')
      .select('*')
      .eq('date', formData.date);
    
    if (data && !error) {
      setReservations(data);
    }
  };

  const requiresExpert = () => {
    return !formData.statements.includes("A fentiek közül egyik sem érvényes rám nézve");
  };

  const getAvailableTherapists = () => {
    if (!formData.location) return [];
    
    return personnel.filter(p => {
      // Must be assigned to selected location
      if (p.location_id !== formData.location?.id) return false;
      
      // If user requires expert, only show experts
      if (requiresExpert() && !p.expert) return false;
      
      return true;
    });
  };

  const calculateAvailableTimeSlots = () => {
    const availableTherapists = getAvailableTherapists();
    const available: string[] = [];

    TIME_SLOTS.forEach(timeSlot => {
      // Check if at least one therapist is available for this time slot
      const hasAvailableTherapist = availableTherapists.some(therapist => {
        return !reservations.some(reservation => 
          reservation.therapist_link === therapist.id && 
          reservation.time === timeSlot
        );
      });

      if (hasAvailableTherapist) {
        available.push(timeSlot);
      }
    });

    setAvailableTimeSlots(available);
  };

  const getAvailableTherapistsForTimeSlot = () => {
    if (!formData.time) return [];
    
    const availableTherapists = getAvailableTherapists();
    
    return availableTherapists.filter(therapist => {
      return !reservations.some(reservation => 
        reservation.therapist_link === therapist.id && 
        reservation.time === formData.time
      );
    });
  };

  const handleStatementChange = (statement: string) => {
    const isLastStatement = statement === "A fentiek közül egyik sem érvényes rám nézve";
    
    if (isLastStatement) {
      setFormData(prev => ({ ...prev, statements: [statement] }));
    } else {
      setFormData(prev => ({
        ...prev,
        statements: prev.statements.includes(statement)
          ? prev.statements.filter(s => s !== statement && s !== "A fentiek közül egyik sem érvényes rám nézve")
          : [...prev.statements.filter(s => s !== "A fentiek közül egyik sem érvényes rám nézve"), statement]
      }));
    }
  };

  const handleNext = () => {
    if (currentStep < 8) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.statements.length > 0;
      case 2: return formData.location !== null;
      case 3: return formData.date !== '';
      case 4: return formData.time !== '';
      case 5: return formData.therapist !== null;
      case 6: return formData.service !== null;
      case 7: return formData.personalData.fullName.trim() !== '';
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!formData.therapist || !formData.service || !formData.location) return;
    
    setLoading(true);
    
    const reservationData = {
      name: formData.personalData.fullName,
      email: '', // Will be added later
      phone: '', // Will be added later
      date: formData.date,
      time: formData.time,
      location: formData.location.name,
      therapist: formData.therapist.name,
      therapist_link: formData.therapist.id,
      service: formData.service.name,
      notes: `Statements: ${formData.statements.join(', ')}`
    };

    const { error } = await supabase
      .from('nyirok_reservations')
      .insert([reservationData]);

    setLoading(false);

    if (!error) {
      alert('Foglalás sikeresen létrehozva!');
      // Reset form
      setFormData({
        statements: [],
        location: null,
        date: '',
        time: '',
        therapist: null,
        service: null,
        personalData: { fullName: '' }
      });
      setCurrentStep(1);
    } else {
      alert('Hiba történt a foglalás során. Kérjük próbálja újra.');
    }
  };

  const renderProgressBar = () => {
    const progress = (currentStep / 8) * 100;
    
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`medical-step-indicator ${
                  isCompleted ? 'medical-step-completed' : 
                  isActive ? 'medical-step-active' : 'medical-step-pending'
                }`}>
                  <Icon size={16} />
                </div>
                <span className="text-xs mt-2 text-center max-w-16">{step.title}</span>
              </div>
            );
          })}
        </div>
        <div className="medical-progress-bar">
          <div 
            className="medical-progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Nyilatkozat</h2>
              <p className="text-slate-600">Az időpontfoglalás előtt kérem jelölje be, ha az alábbiak közül valamelyik érvényes önre. Ez alapján az önnek leginkább megfelelő terapeutát tudjuk kiválasztani.</p>
            </div>
            <div className="space-y-3">
              {STATEMENTS.map((statement, index) => (
                <div
                  key={index}
                  className={`medical-option-card ${formData.statements.includes(statement) ? 'medical-option-selected' : ''}`}
                  onClick={() => handleStatementChange(statement)}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.statements.includes(statement)}
                      onChange={() => {}}
                      className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className={`text-slate-700 cursor-pointer ${index === STATEMENTS.length - 1 ? 'font-semibold' : ''}`}>
                      {statement}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Válassz helyszínt</h2>
              <p className="text-slate-600">Hol szeretnéd igénybe venni a szolgáltatást?</p>
            </div>
            <div className="grid gap-4">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className={`medical-option-card ${formData.location?.id === location.id ? 'medical-option-selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, location }))}
                >
                  <div className="flex items-center space-x-3">
                    <MapPin className="text-blue-600" size={20} />
                    <div>
                      <h3 className="font-semibold text-slate-800">{location.name}</h3>
                      <p className="text-slate-600 text-sm">{location.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Válassz dátumot</h2>
              <p className="text-slate-600">Mikor szeretnél időpontot foglalni?</p>
            </div>
            <div>
              <input
                type="date"
                className="medical-input"
                min={new Date().toISOString().split('T')[0]}
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Válassz időpontot</h2>
              <p className="text-slate-600">Milyen időpontban szeretnél időpontot?</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {TIME_SLOTS.map((timeSlot) => {
                const isAvailable = availableTimeSlots.includes(timeSlot);
                return (
                  <div
                    key={timeSlot}
                    className={`medical-option-card ${
                      formData.time === timeSlot ? 'medical-option-selected' : 
                      !isAvailable ? 'medical-option-disabled' : ''
                    }`}
                    onClick={() => isAvailable && setFormData(prev => ({ ...prev, time: timeSlot }))}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Clock size={16} className={isAvailable ? 'text-blue-600' : 'text-slate-400'} />
                      <span className={`font-medium ${isAvailable ? 'text-slate-800' : 'text-slate-400'}`}>
                        {timeSlot}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 5:
        const availableTherapists = getAvailableTherapistsForTimeSlot();
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Válassz terapeutát</h2>
              <p className="text-slate-600">Ki végezze el a kezelést?</p>
            </div>
            <div className="space-y-4">
              {availableTherapists.map((therapist) => (
                <div
                  key={therapist.id}
                  className={`medical-option-card ${formData.therapist?.id === therapist.id ? 'medical-option-selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, therapist }))}
                >
                  <div className="flex items-start space-x-3">
                    <User className="text-blue-600 mt-1" size={20} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-slate-800">{therapist.name}</h3>
                        {therapist.expert && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Szakértő
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-sm">{therapist.role}</p>
                      {therapist.description && (
                        <p className="text-slate-500 text-sm mt-1">{therapist.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Válassz szolgáltatást</h2>
              <p className="text-slate-600">Melyik kezelést szeretnéd?</p>
            </div>
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`medical-option-card ${formData.service?.id === service.id ? 'medical-option-selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, service }))}
                >
                  <div className="flex items-start space-x-3">
                    <Stethoscope className="text-blue-600 mt-1" size={20} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-slate-800">{service.name}</h3>
                          {service.description && (
                            <p className="text-slate-600 text-sm mt-1">{service.description}</p>
                          )}
                          <p className="text-slate-500 text-sm mt-1">{service.time} perc</p>
                        </div>
                        <span className="text-blue-600 font-bold text-lg">
                          {service.price.toLocaleString()} Ft
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Személyes adatok</h2>
              <p className="text-slate-600">Kérjük, adja meg az alábbi adatokat</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Teljes név *
              </label>
              <input
                type="text"
                className="medical-input"
                placeholder="Adja meg a teljes nevét"
                value={formData.personalData.fullName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  personalData: { ...prev.personalData, fullName: e.target.value }
                }))}
              />
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Összegzés</h2>
              <p className="text-slate-600">Ellenőrizd a foglalás adatait</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Helyszín</h4>
                  <p className="text-slate-900">{formData.location?.name}</p>
                  <p className="text-slate-600 text-sm">{formData.location?.location}</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Időpont</h4>
                  <p className="text-slate-900">{formData.date}</p>
                  <p className="text-slate-600 text-sm">{formData.time}</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Terapeuta</h4>
                  <p className="text-slate-900">{formData.therapist?.name}</p>
                  <p className="text-slate-600 text-sm">{formData.therapist?.role}</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Szolgáltatás</h4>
                  <p className="text-slate-900">{formData.service?.name}</p>
                  <p className="text-slate-600 text-sm">{formData.service?.price.toLocaleString()} Ft</p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="font-medium text-slate-700 mb-2">Személyes adatok</h4>
                  <p className="text-slate-900">{formData.personalData.fullName}</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="medical-container p-8">
        {renderProgressBar()}
        
        <div className="min-h-96">
          {renderStep()}
        </div>
        
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="medical-button-secondary flex items-center space-x-2 disabled:opacity-50"
          >
            <ChevronLeft size={20} />
            <span>Vissza</span>
          </button>
          
          {currentStep === 8 ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="medical-button-primary flex items-center space-x-2"
            >
              {loading ? 'Foglalás...' : 'Foglalás véglegesítése'}
              <CheckCircle size={20} />
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="medical-button-primary flex items-center space-x-2"
            >
              <span>Tovább</span>
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
