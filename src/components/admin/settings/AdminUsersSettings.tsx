// src/components/admin/settings/AdminUsersSettings.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Box, 
  Button, 
  CircularProgress, 
  TextField, 
  Typography, 
  Grid, 
  Alert, 
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { useFirebaseAuth } from '../../../hooks/useFirebaseAuth';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  lastLogin: string | null;
  createdAt: string;
}

interface AdminUserFormData {
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  password?: string;
  confirmPassword?: string;
}

const AdminUsersSettings: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  
  // Get auth context
  const { user } = useFirebaseAuth();
  
  // Initialize form
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<AdminUserFormData>({
    defaultValues: {
      email: '',
      name: '',
      role: 'admin',
      password: '',
      confirmPassword: ''
    }
  });
  
  // Function to get ID token
  const getIdToken = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  };
  
  // Fetch admin users on component mount
  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const token = await getIdToken();
        const response = await fetch('/api/consolidated/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch admin users');
        }
        
        const data = await response.json();
        
        if (data.users && Array.isArray(data.users)) {
          setAdminUsers(data.users);
        }
      } catch (error) {
        console.error('Error fetching admin users:', error);
        setError('Failed to fetch admin users.');
      }
    };
    
    fetchAdminUsers();
  }, [getIdToken]);
  
  // Handle dialog open for adding new user
  const handleAddUser = () => {
    setEditingUser(null);
    reset({
      email: '',
      name: '',
      role: 'admin',
      password: '',
      confirmPassword: ''
    });
    setOpenDialog(true);
  };
  
  // Handle dialog open for editing user
  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    reset({
      email: user.email,
      name: user.name,
      role: user.role,
      password: '',
      confirmPassword: ''
    });
    setOpenDialog(true);
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };
  
  // Handle delete confirmation dialog open
  const handleDeleteConfirm = (user: AdminUser) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };
  
  // Handle delete confirmation dialog close
  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setUserToDelete(null);
  };
  
  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setLoading(true);
    setSuccess(null);
    setError(null);
    
    try {
      const token = await getIdToken();
      
      // Send request to API
      const response = await fetch(`/api/consolidated/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete admin user');
      }
      
      // Remove user from list
      setAdminUsers(adminUsers.filter(u => u.id !== userToDelete.id));
      
      setSuccess(`Admin user ${userToDelete.name} deleted successfully`);
      handleCloseDeleteConfirm();
    } catch (error) {
      console.error('Error deleting admin user:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form submission
  const onSubmit = async (data: AdminUserFormData) => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    
    try {
      const token = await getIdToken();
      
      // Check if passwords match for new users
      if (!editingUser && data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Prepare request body
      const requestBody: any = {
        email: data.email,
        name: data.name,
        role: data.role
      };
      
      // Add password for new users
      if (!editingUser && data.password) {
        requestBody.password = data.password;
      }
      
      // Send request to API
      const url = editingUser 
        ? `/api/consolidated/admin/users/${editingUser.id}` 
        : '/api/consolidated/admin/users';
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save admin user');
      }
      
      const responseData = await response.json();
      
      // Update user list
      if (editingUser) {
        setAdminUsers(adminUsers.map(u => u.id === editingUser.id ? responseData.user : u));
        setSuccess(`Admin user ${data.name} updated successfully`);
      } else {
        setAdminUsers([...adminUsers, responseData.user]);
        setSuccess(`Admin user ${data.name} created successfully`);
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving admin user:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Admin Users</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Manage users with administrative access to the system.
      </Typography>
      
      {/* Success Message */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Card>
        <CardHeader 
          title="Admin Users" 
          subheader="Users with administrative privileges"
          action={
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddUser}
            >
              Add Admin
            </Button>
          }
        />
        <CardContent>
          {adminUsers.length === 0 ? (
            <Alert severity="info">
              No admin users found. Click "Add Admin" to create your first admin user.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {adminUsers.map((adminUser) => (
                    <TableRow key={adminUser.id}>
                      <TableCell>{adminUser.name}</TableCell>
                      <TableCell>{adminUser.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={adminUser.role === 'super_admin' ? 'Super Admin' : 'Admin'} 
                          color={adminUser.role === 'super_admin' ? 'secondary' : 'primary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {adminUser.lastLogin 
                          ? new Date(adminUser.lastLogin).toLocaleString() 
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => handleEditUser(adminUser)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleDeleteConfirm(adminUser)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      
      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit Admin User' : 'Add Admin User'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  fullWidth
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={!!editingUser}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Name"
                  fullWidth
                  {...register('name', { required: 'Name is required' })}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    label="Role"
                    {...register('role', { required: 'Role is required' })}
                    defaultValue="admin"
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="super_admin">Super Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {!editingUser && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      label="Password"
                      fullWidth
                      type="password"
                      {...register('password', { 
                        required: !editingUser ? 'Password is required' : false,
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters'
                        }
                      })}
                      error={!!errors.password}
                      helperText={errors.password?.message}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      label="Confirm Password"
                      fullWidth
                      type="password"
                      {...register('confirmPassword', { 
                        required: !editingUser ? 'Confirm password is required' : false,
                        validate: value => 
                          value === watch('password') || 'Passwords do not match'
                      })}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword?.message}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : editingUser ? <EditIcon /> : <PersonAddIcon />}
            >
              {loading 
                ? 'Saving...' 
                : editingUser 
                  ? 'Update User' 
                  : 'Add User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the admin user "{userToDelete?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>Cancel</Button>
          <Button 
            onClick={handleDeleteUser} 
            color="error" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsersSettings;
