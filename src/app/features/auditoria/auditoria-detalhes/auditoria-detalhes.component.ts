import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuditoriaService } from '../../../core/services/auditoria.service';
import { AuditoriaDTO, TIPO_OPERACAO_LABELS, TIPO_OPERACAO_SEVERITY } from '../../../core/models/auditoria.model';
import { PermissaoService } from '../../../core/services/permissao.service';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-auditoria-detalhes',
  templateUrl: './auditoria-detalhes.component.html',
  styleUrls: ['./auditoria-detalhes.component.scss']
})
export class AuditoriaDetalhesComponent implements OnInit {
  auditoria?: AuditoriaDTO;
  carregando = false;
  
  dadosAntigosFormatados: any = null;
  dadosNovosFormatados: any = null;

  breadcrumbItems: BreadcrumbItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auditoriaService: AuditoriaService,
    private permissaoService: PermissaoService
  ) {}

  ngOnInit(): void {
    if (!this.temPermissao(Permissao.CONSULTAR)) {
      this.router.navigate(['/acesso-negado']);
      return;
    }

    this.configurarBreadcrumb();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.carregar(+id);
    }
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Administração', icon: 'pi pi-cog' },
      { label: 'Auditoria' },
      { label: 'Detalhes' }
    ];
  }

  carregar(id: number): void {
    this.carregando = true;
    this.auditoriaService.buscarPorRevisaoId(id).subscribe({
      next: (auditoria) => {
        this.auditoria = auditoria;
        this.processarDados();
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.router.navigate(['/auditoria']);
      }
    });
  }

  processarDados(): void {
    if (!this.auditoria) return;

    // Backend retorna dadosAntes e dadosDepois já como objetos
    if (this.auditoria.dadosAntes) {
      this.dadosAntigosFormatados = this.auditoria.dadosAntes;
    }

    if (this.auditoria.dadosDepois) {
      this.dadosNovosFormatados = this.auditoria.dadosDepois;
    }
  }

  temPermissao(permissao: Permissao): boolean {
    return this.permissaoService.temPermissao(Funcionalidade.AUDITORIA, permissao);
  }

  getLabelOperacao(): string {
    if (!this.auditoria) return '';
    return TIPO_OPERACAO_LABELS[this.auditoria.tipoOperacao as keyof typeof TIPO_OPERACAO_LABELS] || this.auditoria.tipoOperacao;
  }

  getSeverityOperacao(): 'success' | 'info' | 'danger' | 'warning' {
    if (!this.auditoria) return 'info';
    const severity = TIPO_OPERACAO_SEVERITY[this.auditoria.tipoOperacao as keyof typeof TIPO_OPERACAO_SEVERITY];
    return severity || 'info';
  }

  formatarDataHora(dataHora: string): string {
    if (!dataHora) return '';
    const data = new Date(dataHora);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatarCpf(cpf: string): string {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  getChavesDados(): string[] {
    const chaves = new Set<string>();
    
    if (this.dadosAntigosFormatados) {
      Object.keys(this.dadosAntigosFormatados).forEach(chave => chaves.add(chave));
    }
    
    if (this.dadosNovosFormatados) {
      Object.keys(this.dadosNovosFormatados).forEach(chave => chaves.add(chave));
    }
    
    return Array.from(chaves).sort();
  }

  valorAlterado(chave: string): boolean {
    if (!this.dadosAntigosFormatados || !this.dadosNovosFormatados) {
      return false;
    }
    
    const valorAntigo = this.dadosAntigosFormatados[chave];
    const valorNovo = this.dadosNovosFormatados[chave];
    
    return JSON.stringify(valorAntigo) !== JSON.stringify(valorNovo);
  }

  formatarValor(valor: any): string {
    if (valor === null || valor === undefined) {
      return 'null';
    }
    if (typeof valor === 'object') {
      return JSON.stringify(valor, null, 2);
    }
    return String(valor);
  }

  voltar(): void {
    this.router.navigate(['/auditoria']);
  }
}
