import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
    SectorsQuantityCylinder, 
    fetchAllSectors,
    assignCylinderToLocation,
    getCylinderBySerial,
    SetorCompleto,
    LocalConsomeCilindro, 
} from '@/services/cylinder-movementsService';

export interface TabelaMovimentacaoItem {
    id: number; 
    codigo_serial: string;
    destino: string;
    pressao: number;
    percentual_respirador: number;
    matricula: string;
    data_consumo: string;
}


export const useMovimentacoes = () => {
    const { status } = useSession();
    const [dados, setDados] = useState<TabelaMovimentacaoItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [setores, setSetores] = useState<SetorCompleto[]>([]); 

    const fetchData = useCallback(async () => {
        
        if (status !== 'authenticated') {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
         
            const historicoCompleto = await SectorsQuantityCylinder();

            // Usa os dados embutidos do backend (setor_nome, cilindro_serial, usuario_matricula)
            // eliminando as requisições N+1 individuais
            const tabelaData = historicoCompleto.map((registro: LocalConsomeCilindro) => ({
                id: registro.id_local_consome_cilindro, 
                codigo_serial: registro.cilindro_serial || `Cilindro #${registro.id_cilindro}`,
                destino: registro.setor_nome || `Setor #${registro.id_setor}`,
                pressao: registro.pressao,
                percentual_respirador: registro.percentual_respirador,
                matricula: registro.usuario_matricula || registro.usuario_nome || `Usuário #${registro.id_usuario}`,
                data_consumo: new Date(registro.data_consumo).toLocaleDateString('pt-BR'), 
            }));

            setDados(tabelaData);

        } catch (err) {
            setError(err instanceof Error ? err : new Error('Ocorreu um erro desconhecido'));
        } finally {
            setIsLoading(false);
        }
    }, [status]); 

    useEffect(() => {
        const getSectors = async () => {
            if (status === 'authenticated') {
                try {
                    
                    const sectorsData = await fetchAllSectors();
                    setSetores(sectorsData);
                } catch (err) {
                    console.error("Erro ao carregar setores:", err);
                }
            }
        };

        if (status === 'authenticated') {
            fetchData();
            getSectors();
        } else if (status !== 'loading') {
            setIsLoading(false);
        }
    }, [status, fetchData]);

    const addMovimentacao = async (
        data: {
            codigo_serial: string;
            id_setor: number;
            pressao: number;
            percentual_respirador: number;
        },
        id_usuario: number
    ) => {
        if (status !== 'authenticated') throw new Error("Usuário não autenticado.");

        try {
            
            const fetchedCylinder = await getCylinderBySerial(data.codigo_serial);
            if (!fetchedCylinder || !fetchedCylinder.id_cilindro) {
                throw new Error("Cilindro não encontrado com este código serial.");
            }

            await assignCylinderToLocation({
                id_cilindro: fetchedCylinder.id_cilindro,
                id_setor: data.id_setor,
                id_usuario: id_usuario,
                pressao: data.pressao,
                percentual_respirador: data.percentual_respirador,
            });
            
            await fetchData();

        } catch (error) {
            console.error("Falha no processo de adicionar movimentação:", error);
            throw error;
        }
    };

    return { dados, isLoading, error, refetch: fetchData, setores, addMovimentacao };
};