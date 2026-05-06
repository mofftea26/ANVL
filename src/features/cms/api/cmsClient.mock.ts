import type { CmsClient } from '@/app/config/clients'
import { cmsMockData } from '../data/cms.mock'

export const mockCmsClient: CmsClient = {
  async getHomepageContent() {
    return cmsMockData.homepageContent
  },
  async getAnnouncementBar() {
    return cmsMockData.announcementBar
  },
  async getNavigation() {
    return cmsMockData.navigation
  },
  async getCampaigns() {
    return cmsMockData.campaigns
  },
  async getLookbook() {
    return cmsMockData.lookbook
  },
  async getSeoByPath(path) {
    return cmsMockData.seoByPath[path] ?? null
  },
}
