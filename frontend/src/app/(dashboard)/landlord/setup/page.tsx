"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, ChevronLeft, Trash2, Home, Plus, Settings2 } from "lucide-react";

export default function SetupWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // Step 1: Services
  const [services, setServices] = useState([
    { id: "1", name: "Điện", type: "Theo đồng hồ", price: "3.500", unit: "kWh" },
    { id: "2", name: "Nước", type: "Theo đồng hồ", price: "25.000", unit: "m³" },
    { id: "3", name: "Rác", type: "Cố định", price: "20.000", unit: "phòng" },
    { id: "4", name: "Bảo vệ", type: "Cố định", price: "50.000", unit: "phòng" },
    { id: "5", name: "Vệ sinh", type: "Cố định", price: "30.000", unit: "phòng" },
    { id: "6", name: "Wifi", type: "Cố định", price: "100.000", unit: "phòng" },
  ]);

  const addService = () => {
    const newId = Date.now().toString();
    setServices([...services, { id: newId, name: "", type: "Cố định", price: "", unit: "" }]);
  };

  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const updateService = (id: string, field: string, value: string) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Step 2: Buildings
  const [buildings, setBuildings] = useState([
    { id: "1", name: "Tòa A", floors: 3 },
  ]);

  const addBuilding = () => {
    const newId = Date.now().toString();
    setBuildings([...buildings, { id: newId, name: "", floors: 1 }]);
  };

  const removeBuilding = (id: string) => {
    setBuildings(buildings.filter(b => b.id !== id));
  };

  const updateBuilding = (id: string, field: string, value: string | number) => {
    setBuildings(buildings.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  // Step 3: Rooms
  const [defaultRoomsPerFloor, setDefaultRoomsPerFloor] = useState(5);
  const [defaultPrice, setDefaultPrice] = useState("3.000.000");
  const [roomData, setRoomData] = useState<any[]>([]);

  const generateInitialRoomData = () => {
    const newRoomData = buildings.map(b => {
      const floors: { floorNumber: number, rooms: string[] }[] = [];
      const numFloors = Number(b.floors) || 1;
      for (let f = 1; f <= numFloors; f++) {
        const rooms: string[] = [];
        for (let r = 1; r <= defaultRoomsPerFloor; r++) {
          const roomNum = r < 10 ? `0${r}` : `${r}`;
          rooms.push(`${f}${roomNum}`);
        }
        floors.push({ floorNumber: f, rooms });
      }
      return {
        buildingId: b.id,
        buildingName: b.name || `Tòa ${b.id}`,
        floors
      };
    });
    setRoomData(newRoomData);
  };

  const handleNextToStep3 = () => {
    generateInitialRoomData();
    setStep(3);
  };

  const handleRegenerateBuilding = (bId: string) => {
    const b = buildings.find(x => x.id === bId);
    if (!b) return;
    const floors: { floorNumber: number, rooms: string[] }[] = [];
    const numFloors = Number(b.floors) || 1;
    for (let f = 1; f <= numFloors; f++) {
      const rooms: string[] = [];
      for (let r = 1; r <= defaultRoomsPerFloor; r++) {
         const roomNum = r < 10 ? `0${r}` : `${r}`;
         rooms.push(`${f}${roomNum}`);
      }
      floors.push({ floorNumber: f, rooms });
    }
    setRoomData(prev => prev.map(rd => rd.buildingId === bId ? { ...rd, floors } : rd));
  };

  const addRoom = (bId: string, fIndex: number) => {
    setRoomData(prev => prev.map(rd => {
      if (rd.buildingId !== bId) return rd;
      const newFloors = [...rd.floors];
      const floor = { ...newFloors[fIndex], rooms: [...newFloors[fIndex].rooms] };
      const fNum = floor.floorNumber;
      const currentCount = floor.rooms.length;
      const rNum = currentCount + 1;
      const roomName = `${fNum}${rNum < 10 ? `0${rNum}` : rNum}`;
      floor.rooms.push(roomName);
      newFloors[fIndex] = floor;
      return { ...rd, floors: newFloors };
    }));
  };

  const removeFloor = (bId: string, fIndex: number) => {
    setRoomData(prev => prev.map(rd => {
      if (rd.buildingId !== bId) return rd;
      const newFloors = [...rd.floors];
      newFloors.splice(fIndex, 1);
      return { ...rd, floors: newFloors };
    }));
  };

  const addFloor = (bId: string) => {
    setRoomData(prev => prev.map(rd => {
      if (rd.buildingId !== bId) return rd;
      const newFloors = [...rd.floors];
      const nextFloorNum = newFloors.length > 0 ? newFloors[newFloors.length - 1].floorNumber + 1 : 1;
      const rooms: string[] = [];
      for (let r = 1; r <= defaultRoomsPerFloor; r++) {
         const roomNum = r < 10 ? `0${r}` : `${r}`;
         rooms.push(`${nextFloorNum}${roomNum}`);
      }
      newFloors.push({ floorNumber: nextFloorNum, rooms });
      return { ...rd, floors: newFloors };
    }));
  };

  const totalBuildings = roomData.length;
  const totalRooms = roomData.reduce((acc, bd) => acc + bd.floors.reduce((fAcc: number, f: any) => fAcc + f.rooms.length, 0), 0);

  const handleFinish = () => {
    router.push("/landlord");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 bg-zinc-50/50 min-h-screen p-8 rounded-3xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Thiết lập nhà trọ</h1>
        <p className="text-sm text-zinc-500 mt-2">Cấu hình xong tất cả rồi nhấn Hoàn tất để tạo</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-center gap-3">
        <button 
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-colors ${
            step === 1 ? 'bg-accent text-white shadow-md shadow-accent/20' : step > 1 ? 'bg-accent/10 text-accent' : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          {step > 1 ? <Check className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />} Dịch vụ
        </button>
        <ChevronRight className="w-4 h-4 text-zinc-300" />
        
        <button 
          onClick={() => step > 1 && setStep(2)}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-colors ${
            step === 2 ? 'bg-accent text-white shadow-md shadow-accent/20' : step > 2 ? 'bg-accent/10 text-accent' : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          {step > 2 ? <Check className="w-4 h-4" /> : <BuildingIcon className="w-4 h-4" />} Tòa nhà
        </button>
        <ChevronRight className="w-4 h-4 text-zinc-300" />
        
        <button 
          onClick={() => step > 2 && setStep(3)}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-colors ${
            step === 3 ? 'bg-accent text-white shadow-md shadow-accent/20' : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          <Home className="w-4 h-4" /> Phòng
        </button>
      </div>

      {/* Content */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 md:p-8">
        
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Settings2 className="w-5 h-5" /> Bước 1: Dịch vụ
              </h2>
              <p className="text-sm text-zinc-500 mt-1">Cấu hình dịch vụ và đơn giá mặc định</p>
            </div>
            
            <div className="space-y-4">
              {services.map((s, index) => (
                <div key={s.id} className="border border-zinc-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-end bg-white">
                  <div className="space-y-1.5 w-full md:flex-1">
                    <label className="text-xs font-bold text-zinc-700">Tên</label>
                    <input 
                      type="text" 
                      value={s.name}
                      onChange={(e) => updateService(s.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                    />
                  </div>
                  <div className="space-y-1.5 w-full md:w-40">
                    <label className="text-xs font-bold text-zinc-700">Loại</label>
                    <select 
                      value={s.type}
                      onChange={(e) => updateService(s.id, 'type', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                    >
                      <option value="Theo đồng hồ">Theo đồng hồ</option>
                      <option value="Cố định">Cố định</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 w-full md:flex-1">
                    <label className="text-xs font-bold text-zinc-700">Đơn giá</label>
                    <input 
                      type="text" 
                      value={s.price}
                      onChange={(e) => updateService(s.id, 'price', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                    />
                  </div>
                  <div className="space-y-1.5 w-full md:flex-1">
                    <label className="text-xs font-bold text-zinc-700">Đơn vị</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={s.unit}
                        onChange={(e) => updateService(s.id, 'unit', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                      />
                      <button 
                        onClick={() => removeService(s.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={addService}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <Plus className="w-4 h-4" /> Thêm dịch vụ
            </button>

            <div className="flex justify-end pt-4">
              <button 
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-accent rounded-lg hover:bg-accent-hover shadow-sm transition-all"
              >
                Tiếp theo <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div>
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <BuildingIcon className="w-5 h-5" /> Bước 2: Tòa nhà
              </h2>
              <p className="text-sm text-zinc-500 mt-1">Thêm tòa nhà. Số tầng sẽ dùng để tạo phòng ở bước sau.</p>
            </div>
            
            <div className="space-y-4">
              {buildings.map((b) => (
                <div key={b.id} className="border border-zinc-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-end bg-white">
                  <div className="space-y-1.5 w-full md:flex-1">
                    <label className="text-xs font-bold text-zinc-700">Tên tòa nhà</label>
                    <input 
                      type="text" 
                      value={b.name}
                      onChange={(e) => updateBuilding(b.id, 'name', e.target.value)}
                      placeholder="VD: Tòa A"
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                    />
                  </div>
                  <div className="space-y-1.5 w-full md:flex-1">
                    <label className="text-xs font-bold text-zinc-700">Số tầng</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="1"
                        value={b.floors}
                        onChange={(e) => updateBuilding(b.id, 'floors', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                      />
                      <button 
                        onClick={() => removeBuilding(b.id)}
                        disabled={buildings.length === 1}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={addBuilding}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <Plus className="w-4 h-4" /> Thêm tòa nhà
            </button>

            <div className="flex justify-between pt-4">
              <button 
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>
              <button 
                onClick={handleNextToStep3}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-accent rounded-lg hover:bg-accent-hover shadow-sm transition-all"
              >
                Tiếp theo <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Home className="w-5 h-5" /> Bước 3: Phòng
              </h2>
              <p className="text-sm text-zinc-500 mt-1">Nhấn vào phòng để sửa thông tin. Xóa hoặc thêm phòng tùy ý.</p>
            </div>
            
            {/* Default Config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-zinc-200 bg-zinc-50/50 p-4 rounded-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Phòng/tầng mặc định</label>
                <input 
                  type="number" 
                  value={defaultRoomsPerFloor}
                  onChange={(e) => setDefaultRoomsPerFloor(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Giá thuê mặc định</label>
                <input 
                  type="text" 
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                />
              </div>
            </div>

            {/* Building Blocks */}
            <div className="space-y-6">
              {roomData.map((bd) => {
                const totalRoomsInBuilding = bd.floors.reduce((acc: number, f: any) => acc + f.rooms.length, 0);
                return (
                  <div key={bd.buildingId} className="border border-zinc-200 rounded-xl p-5 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-zinc-900">
                        {bd.buildingName} <span className="text-zinc-500 font-normal">({totalRoomsInBuilding} phòng)</span>
                      </h3>
                      <button 
                        onClick={() => handleRegenerateBuilding(bd.buildingId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Tạo lại
                      </button>
                    </div>

                    <div className="space-y-4">
                      {bd.floors.map((floor: any, fIndex: number) => (
                        <div key={fIndex} className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span className="font-semibold text-zinc-700">Tầng {floor.floorNumber}</span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => addRoom(bd.buildingId, fIndex)} className="hover:text-accent hover:underline">+ thêm</button>
                              <span>·</span>
                              <button onClick={() => removeFloor(bd.buildingId, fIndex)} className="hover:text-red-500 hover:underline">xóa tầng</button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {floor.rooms.map((roomName: string, rIndex: number) => (
                              <div key={rIndex} className="px-4 py-2 bg-zinc-100 text-zinc-700 text-sm font-semibold rounded-lg border border-zinc-200 hover:border-accent hover:bg-accent/5 cursor-pointer transition-colors">
                                {roomName}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-100">
                      <button 
                        onClick={() => addFloor(bd.buildingId)}
                        className="text-xs font-bold text-zinc-500 hover:text-accent transition-colors flex items-center gap-1"
                      >
                        + Thêm tầng
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="bg-zinc-100/80 rounded-xl p-4 text-sm text-zinc-700 flex items-center gap-2">
              <span className="font-bold">Tổng kết:</span> 
              {totalBuildings} tòa nhà, {totalRooms} phòng 
              <span className="text-zinc-400">·</span> 
              <span className="text-zinc-500">Giá từ {defaultPrice} đ</span>
            </div>

            <div className="flex justify-between pt-4">
              <button 
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>
              <button 
                onClick={handleFinish}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-accent rounded-lg hover:bg-accent-hover shadow-sm shadow-accent/20 transition-all"
              >
                Hoàn tất <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Temporary custom icons to match the design style
function BuildingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}
