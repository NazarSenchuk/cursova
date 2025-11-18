export class DateManager {
  static formatImageDate(date) {
    const options = {
      year: 'numeric',
      month: 'long',  
      day: 'numeric'
    };
    const formatter = new Intl.DateTimeFormat('uk-UA', options);
    return formatter.format(new Date(date));
  }

  static groupByYear(images) {
    const groups = {};
    images.forEach(image => {
      const year = new Date(image.created_at).getFullYear();
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(image);
    });
    return groups;
  }

  static groupByMonth(images) {
    const groups = {};
    images.forEach(image => {
      const date = new Date(image.created_at);
      const yearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleDateString('uk-UA', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      if (!groups[yearMonth]) {
        groups[yearMonth] = {
          name: monthName,
          images: []
        };
      }
      groups[yearMonth].images.push(image);
    });
    return groups;
  }

  static getLastMonth(images) {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return this.getImagesByDateRange(images, oneMonthAgo, new Date());
  }

  static getRecentImages(images, days = 7) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    return this.getImagesByDateRange(images, daysAgo, new Date());
  }

  static getImagesByDateRange(images, fromDate, toDate) {
    return images.filter(image => {
      const imageDate = new Date(image.created_at);
      return imageDate >= fromDate && imageDate <= toDate;
    });
  }

  static getAllPeriodGroups(images) {
    const monthlyGroups = this.groupByMonth(images);
    const yearlyGroups = this.groupByYear(images);
    
    return {
      recent: { 
        name: '🕐 Останній тиждень', 
        images: this.getRecentImages(images) 
      },
      month: { 
        name: '📅 Останній місяць', 
        images: this.getLastMonth(images) 
      },
      ...monthlyGroups,
      ...Object.entries(yearlyGroups).reduce((acc, [year, images]) => {
        acc[`year-${year}`] = {
          name: `📅 Рік ${year}`,
          images: images
        };
        return acc;
      }, {})
    };
  }

  static getSortedMonths(images) {
    const monthlyGroups = this.groupByMonth(images);
    return Object.entries(monthlyGroups)
      .sort(([a], [b]) => b.localeCompare(a));
  }

  static getSortedYears(images) {
    const yearlyGroups = this.groupByYear(images);
    return Object.entries(yearlyGroups)
      .sort(([a], [b]) => b - a);
  }
}