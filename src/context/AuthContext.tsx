import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, testConnection } from '../lib/firebase';
import {
  getUserProfile,
  createUserProfile,
  getAssociadoByUid,
  seedInitialDatabaseIfEmpty,
  createAssociado,
  getNextNumeroAssociado,
  findAssociadoByCpfOrCodigo,
  checkCpfBloqueado,
} from '../services/db';
import { UserProfile, UserRole, Associado } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  activeRole: UserRole;
  currentAssociado: Associado | null;
  loading: boolean;
  isDemoMode: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  switchRolePersona: (role: UserRole) => void;
  refreshUserData: () => Promise<void>;
  loginWithCpfOrCode: (
    cpfOrCodigo: string
  ) => Promise<{ success: boolean; error?: string; blocked?: Associado; associado?: Associado }>;
  setCurrentAssociadoExplicitly: (assoc: Associado | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('administrador');
  const [currentAssociado, setCurrentAssociado] = useState<Associado | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  const loadOrCreateUser = async (firebaseUser: User) => {
    try {
      await testConnection();
      await seedInitialDatabaseIfEmpty();

      let profile = await getUserProfile(firebaseUser.uid);
      const isSystemAdminEmail =
        firebaseUser.email?.toLowerCase() === 'dinastiasystem@gmail.com';

      if (!profile) {
        // First login: bootstrap user
        const newRole: UserRole = isSystemAdminEmail ? 'administrador' : 'associado';
        profile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || 'usuario@motoclube.com',
          nome: firebaseUser.displayName || 'Irmão de Estrada',
          role: newRole,
          status: 'ativo',
          createdAt: new Date().toISOString(),
        };
        await createUserProfile(profile);
      }

      // Check or create associated member dossier
      let associado = await getAssociadoByUid(firebaseUser.uid);
      if (!associado && isSystemAdminEmail) {
        // Create initial Founder / Admin member file
        const nextNum = await getNextNumeroAssociado();
        const assocId = firebaseUser.uid;
        const newAssoc: Omit<Associado, 'id'> = {
          uid: firebaseUser.uid,
          numeroAssociado: nextNum,
          nome: firebaseUser.displayName || 'Comandante Dinastia',
          nomeGuerra: 'Falcão da Estrada',
          cpf: '123.456.789-00',
          rg: '12.345.678-9',
          dataNascimento: '15/04/1982',
          tipoSanguineo: 'O+',
          email: firebaseUser.email || 'dinastiasystem@gmail.com',
          telefone: '(11) 98765-4321',
          whatsapp: '(11) 98765-4321',
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          numero: '1000',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          estado: 'SP',
          cnhNumero: '98765432100',
          cnhCategoria: 'A',
          cnhValidade: '20/12/2028',
          regional: 'São Paulo - Matriz',
          cargo: 'Presidente Fundador',
          status: 'ativo',
          fotoUrl: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
          dataAssociacao: '12/10/2018',
          observacoes: 'Membro fundador com mais de 300.000 km rodados em expedições nacionais e continentais.',
          aprovadoPor: 'Diretoria Executiva',
          aprovadoEm: '12/10/2018',
          contatosEmergencia: [
            { nome: 'Ana Paula Rocha', parentesco: 'Esposa', telefone: '(11) 99988-7766' },
            { nome: 'Carlos Eduardo', parentesco: 'Irmão de Estrada (VP)', telefone: '(11) 98877-6655' },
          ],
          createdAt: new Date().toISOString(),
        };
        await createAssociado(newAssoc, assocId);
        associado = { id: assocId, ...newAssoc };
      }

      setUserProfile(profile);
      setActiveRole(profile.role);
      setCurrentAssociado(associado);
    } catch (err) {
      console.error('Error initializing user profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        setIsDemoMode(false);
        await loadOrCreateUser(firebaseUser);
      } else {
        // Fallback default persona for seamless preview & exploration
        setCurrentUser(null);
        setIsDemoMode(true);
        // Default demo profile as Administrador for evaluation
        const demoProfile: UserProfile = {
          uid: 'demo-admin-uid',
          email: 'dinastiasystem@gmail.com',
          nome: 'Capitão da Estrada (Admin)',
          role: 'administrador',
          status: 'ativo',
          createdAt: new Date().toISOString(),
        };
        const demoAssociado: Associado = {
          id: 'demo-admin-uid',
          uid: 'demo-admin-uid',
          numeroAssociado: 'MC-000001',
          nome: 'Roberto "Trovão" Silveira',
          nomeGuerra: 'Trovão Negro',
          cpf: '123.456.789-00',
          rg: '12.345.678-9',
          dataNascimento: '15/04/1982',
          tipoSanguineo: 'O+',
          email: 'dinastiasystem@gmail.com',
          telefone: '(11) 98765-4321',
          whatsapp: '(11) 98765-4321',
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          numero: '1000',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          estado: 'SP',
          cnhNumero: '98765432100',
          cnhCategoria: 'A',
          cnhValidade: '20/12/2028',
          regional: 'São Paulo - Matriz',
          cargo: 'Presidente',
          status: 'ativo',
          fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
          dataAssociacao: '10/01/2019',
          observacoes: 'Membro veterano, fundador da regional Sudeste.',
          aprovadoPor: 'Conselho do Moto Clube',
          aprovadoEm: '10/01/2019',
          contatosEmergencia: [
            { nome: 'Juliana Silveira', parentesco: 'Esposa', telefone: '(11) 99123-4567' },
            { nome: 'Carlos Eduardo', parentesco: 'Vice-Presidente', telefone: '(11) 98877-6655' },
          ],
          createdAt: new Date().toISOString(),
        };
        setUserProfile(demoProfile);
        setActiveRole('administrador');
        setCurrentAssociado(demoAssociado);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setIsDemoMode(true);
      setActiveRole('associado');
    } catch (error) {
      console.error('Sign-Out Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Persona switcher for testing and demonstration of the 3 roles
  const switchRolePersona = (role: UserRole) => {
    startTransition(() => {
      setActiveRole(role);
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          role,
        });
      }
    });
  };

  const refreshUserData = async () => {
    if (currentUser) {
      await loadOrCreateUser(currentUser);
    }
  };

  const loginWithCpfOrCode = async (
    cpfOrCodigo: string
  ): Promise<{ success: boolean; error?: string; blocked?: Associado; associado?: Associado }> => {
    try {
      const clean = cpfOrCodigo.trim();
      if (!clean) {
        return { success: false, error: 'Informe o CPF ou o Código do Associado.' };
      }

      // 1. Verificar bloqueio / desligamento por CPF
      const blocked = await checkCpfBloqueado(clean);
      if (blocked) {
        return { success: false, blocked };
      }

      // 2. Localizar associado no sistema
      const assoc = await findAssociadoByCpfOrCodigo(clean);
      if (!assoc) {
        return {
          success: false,
          error: 'Nenhum associado localizado com o CPF ou Código informado. Verifique os dados.',
        };
      }

      // 3. Se for desligado
      if (assoc.status === 'desligado') {
        return { success: false, blocked: assoc };
      }

      // 4. Logar com sucesso na persona do associado
      startTransition(() => {
        setCurrentAssociado(assoc);
        setActiveRole('associado');
        setUserProfile({
          uid: assoc.uid || assoc.id,
          email: assoc.email || 'associado@ironsidemc.com.br',
          nome: assoc.nome,
          role: 'associado',
          status: 'ativo',
          associadoId: assoc.id,
          cpf: assoc.cpf,
          createdAt: assoc.createdAt,
        });
      });

      return { success: true, associado: assoc };
    } catch (err) {
      console.error('Erro ao efetuar login por CPF/Código:', err);
      return { success: false, error: 'Erro inesperado ao consultar base de associados.' };
    }
  };

  const setCurrentAssociadoExplicitly = (assoc: Associado | null) => {
    setCurrentAssociado(assoc);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        activeRole,
        currentAssociado,
        loading,
        isDemoMode,
        signInWithGoogle,
        signOut,
        switchRolePersona,
        refreshUserData,
        loginWithCpfOrCode,
        setCurrentAssociadoExplicitly,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
