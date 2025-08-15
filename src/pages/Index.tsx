
import ReservationSystem from "@/components/ReservationSystem";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Időpontfoglalás
          </h1>
          <p className="text-xl text-slate-600">
            Foglaljon időpontot egyszerűen és gyorsan
          </p>
        </div>
        
        <ReservationSystem />
      </div>
    </div>
  );
};

export default Index;
