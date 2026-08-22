/**
 * BrazilLocationService — Integração BrasilAPI + ViaCEP Fallback
 * 
 * Fornece consulta resiliente de endereços por CEP, dados de CNPJ, bancos,
 * feriados nacionais e taxas de câmbio/tabelas FIPE via APIs públicas brasileiras.
 * 
 * Fontes:
 * - Primária: BrasilAPI (https://brasilapi.com.br)
 * - Fallback: ViaCEP (https://viacep.com.br/ws/{cep}/json/)
 */

export interface CepAddressResult {
  cep: string;
  logradouro: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  ibge?: string;
  ddd?: string;
  source: 'brasilapi' | 'viacep';
}

export interface CnpjResult {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  situacao_cadastral: string;
  cnae_fiscal_descricao?: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone?: string;
  email?: string;
}

export interface BankResult {
  ispb: string;
  name: string;
  code: number | null;
  fullName: string;
}

export class BrazilLocationService {
  private readonly brasilApiBase = 'https://brasilapi.com.br/api';
  private readonly viaCepBase = 'https://viacep.com.br/ws';

  /**
   * Limpa formatação de CEP (remove traços e pontos)
   */
  private sanitizeCep(cep: string): string {
    return cep.replace(/\D/g, '').trim();
  }

  /**
   * Consulta endereço completo por CEP com fallback automático:
   * 1. Tenta BrasilAPI (v2 / v1)
   * 2. Em caso de falha ou timeout, utiliza ViaCEP
   */
  async getAddressByCep(rawCep: string): Promise<CepAddressResult | null> {
    const cep = this.sanitizeCep(rawCep);
    if (cep.length !== 8) {
      console.warn(`[BrazilLocationService] CEP inválido: "${rawCep}"`);
      return null;
    }

    // 1. Primária: BrasilAPI
    try {
      console.log(`[BrazilLocationService] Consultando CEP ${cep} na BrasilAPI...`);
      const response = await fetch(`${this.brasilApiBase}/cep/v2/${cep}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          cep: data.cep || cep,
          logradouro: data.street || '',
          bairro: data.neighborhood || '',
          cidade: data.city || '',
          uf: data.state || '',
          source: 'brasilapi',
        };
      }
    } catch (err: any) {
      console.warn(`[BrazilLocationService] BrasilAPI falhou (${err.message}). Acionando fallback ViaCEP...`);
    }

    // 2. Fallback: ViaCEP
    try {
      console.log(`[BrazilLocationService] Consultando CEP ${cep} no ViaCEP (Fallback)...`);
      const response = await fetch(`${this.viaCepBase}/${cep}/json/`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.erro) {
          console.warn(`[BrazilLocationService] CEP ${cep} não encontrado no ViaCEP.`);
          return null;
        }

        return {
          cep: data.cep?.replace(/\D/g, '') || cep,
          logradouro: data.logradouro || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          uf: data.uf || '',
          ibge: data.ibge || '',
          ddd: data.ddd || '',
          source: 'viacep',
        };
      }
    } catch (err: any) {
      console.error(`[BrazilLocationService] Ambas APIs falharam para o CEP ${cep}:`, err);
    }

    return null;
  }

  /**
   * Consulta dados cadastrais de CNPJ via BrasilAPI
   */
  async getCnpj(rawCnpj: string): Promise<CnpjResult | null> {
    const cnpj = rawCnpj.replace(/\D/g, '').trim();
    if (cnpj.length !== 14) {
      console.warn(`[BrazilLocationService] CNPJ inválido: "${rawCnpj}"`);
      return null;
    }

    try {
      const res = await fetch(`${this.brasilApiBase}/cnpj/v1/${cnpj}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) return null;
      const data = await res.json();

      return {
        cnpj: data.cnpj || cnpj,
        razao_social: data.razao_social || '',
        nome_fantasia: data.nome_fantasia || '',
        situacao_cadastral: data.descricao_situacao_cadastral || '',
        cnae_fiscal_descricao: data.cnae_fiscal_descricao || '',
        logradouro: data.logradouro || '',
        numero: data.numero || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: data.uf || '',
        cep: data.cep || '',
        telefone: data.ddd_telefone_1 || '',
        email: data.email || '',
      };
    } catch (err: any) {
      console.error(`[BrazilLocationService] Erro ao consultar CNPJ ${cnpj}:`, err);
      return null;
    }
  }

  /**
   * Lista bancos registrados via BrasilAPI
   */
  async getBanks(): Promise<BankResult[]> {
    try {
      const res = await fetch(`${this.brasilApiBase}/banks/v1`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error('[BrazilLocationService] Erro ao listar bancos:', err);
      return [];
    }
  }

  /**
   * Consulta feriados nacionais do ano
   */
  async getHolidays(year: number = new Date().getFullYear()): Promise<Array<{ date: string; name: string; type: string }>> {
    try {
      const res = await fetch(`${this.brasilApiBase}/feriados/v1/${year}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error(`[BrazilLocationService] Erro ao listar feriados de ${year}:`, err);
      return [];
    }
  }
}
