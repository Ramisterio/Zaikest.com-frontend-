"use client";

//import RegisterForm from "../../components/RegisterForm";
import RegisterModal from "../../components/modals/RegisterModal";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <RegisterModal defaultOpen />
    </div>
  );
}
