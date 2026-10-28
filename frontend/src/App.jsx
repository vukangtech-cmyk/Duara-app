import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth.jsx";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import Loader from "./components/Loader.jsx";
import "./App.css";

// Lazy-loaded Full Pages
const Home = lazy(() => import("./pages/Home.jsx"));
const Search = lazy(() => import("./pages/Search.jsx"));
const ProductDetail = lazy(() => import("./pages/ProductDetail.jsx"));
const AddListing = lazy(() => import("./pages/AddListing.jsx"));
const EditListing = lazy(() => import("./pages/EditListing.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const SellerProfile = lazy(() => import("./pages/SellerProfile.jsx"));
const Messages = lazy(() => import("./pages/Messages.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.jsx"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers.jsx"));
const AdminListings = lazy(() => import("./pages/admin/AdminListings.jsx"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports.jsx"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories.jsx"));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loader message="Inatayarisha Duara Sokoni..." minHeight="80vh" />}>
          <Routes>
            <Route element={<Layout />}>
              {/* Public Marketplace Pages */}
              <Route path="/" element={<Home />} />
              <Route path="/tafuta" element={<Search />} />
              <Route path="/bidhaa/:id" element={<ProductDetail />} />
              <Route path="/muuzaji/:id" element={<SellerProfile />} />
              <Route path="/ingia" element={<Login />} />
              <Route path="/jisajili" element={<Register />} />

              {/* Protected User Pages */}
              <Route
                path="/ongeza"
                element={
                  <ProtectedRoute>
                    <AddListing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hariri/:id"
                element={
                  <ProtectedRoute>
                    <EditListing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mimi"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ujumbe"
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                }
              />

              {/* Admin Pages */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/watumiaji"
                element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/listings"
                element={
                  <AdminRoute>
                    <AdminListings />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/ripoti"
                element={
                  <AdminRoute>
                    <AdminReports />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/kategoria"
                element={
                  <AdminRoute>
                    <AdminCategories />
                  </AdminRoute>
                }
              />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
