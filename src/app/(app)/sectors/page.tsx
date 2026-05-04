"use client";

import { useState } from "react";
import Panel from "@/components/Panel";
import InfoItem from "@/components/InfoItem";
import { useSectors } from "@/hooks/useSectors";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ChevronRight } from "lucide-react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { SectorsHistoryStatus, SectorsResultNameAndId } from "@/services/sectorsService";

export default function SectorsPage() {
    const { sectors, cylinderCounts, isLoading, error } = useSectors();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSector, setSelectedSector] = useState<SectorsResultNameAndId | null>(null);
    const [formData, setFormData] = useState({ pacientes: '', pontos_ativos: '', duracao_media: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);

    const handleOpenModal = (sector: SectorsResultNameAndId) => {
        setSelectedSector(sector);
        setIsModalOpen(true);
        setSubmitStatus(null);
        setFormData({ pacientes: '', pontos_ativos: '', duracao_media: '' });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSector) return;

        setIsSubmitting(true);
        setSubmitStatus(null);
        try {
            const payload = {
                id_setor: selectedSector.id_setor,
                pacientes: Number(formData.pacientes),
                pontos_ativos: Number(formData.pontos_ativos),
                duracao_media: Number(formData.duracao_media),
            };
            await SectorsHistoryStatus(payload);
            setSubmitStatus({ success: true, message: "Histórico de status adicionado com sucesso!" });
            setTimeout(() => {
                setIsModalOpen(false);
            }, 2000);
        } catch {
            setSubmitStatus({ success: false, message: "Falha ao adicionar histórico. Tente novamente." });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-10">
                <LoadingSpinner size={48} />
            </div>
        );
    }

    if (error) {
        return <div>Ocorreu um erro ao buscar os dados: {error.message}</div>
    }

    return (
        <div className="min-h-screen flex">
            <main className="flex-1 flex items-center justify-center p-8">
                <div className="w-full overflow-y-auto">
                    <h2 className="text-2xl font-bold mb-6 text-gray-700">Status dos Setores</h2>
                    {sectors.map((sector) => (
                        <Panel key={sector.id_setor} className="mb-6 flex items-center !p-4 justify-between ">
                            <h2 className="text-lg mb-0 font-bold">{sector.setor}</h2>
                            <div className="flex items-center gap-4">
                                <InfoItem label="Id" value={sector.id_setor} label2="Quantidade" value2={cylinderCounts[sector.id_setor] || 0}></InfoItem>
                                <button
                                    onClick={() => handleOpenModal(sector)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </Panel>
                    ))}
                </div>
            </main>

            {selectedSector && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Adicionar Histórico para: ${selectedSector.setor}`}>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="pacientes" className="block text-sm font-medium text-gray-700">Nº de Pacientes</label>
                                <input type="number" name="pacientes" id="pacientes" value={formData.pacientes} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="pontos_ativos" className="block text-sm font-medium text-gray-700">Nº de Pontos Ativos</label>
                                <input type="number" name="pontos_ativos" id="pontos_ativos" value={formData.pontos_ativos} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="duracao_media" className="block text-sm font-medium text-gray-700">Duração Média (horas)</label>
                                <input type="number" name="duracao_media" id="duracao_media" value={formData.duracao_media} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                        </div>
                        {submitStatus && (
                            <div className={`mt-4 text-sm ${submitStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                                {submitStatus.message}
                            </div>
                        )}
                        <div className="mt-6 flex justify-end space-x-3">
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <LoadingSpinner size={20} /> : 'Adicionar'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}